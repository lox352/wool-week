import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody } from "@react-three/rapier";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { createStitchGeometry } from "./stitch-geometry";

interface StitchInstancesProps {
  stitches: Stitch[];
  /** Resting positions, when the hat has already been settled. */
  settled?: Point[];
  moving: boolean;
  stitchRefs: React.MutableRefObject<React.RefObject<RapierRigidBody>[]>;
  /** Target colours, three floats per drawn stitch. */
  colours: React.MutableRefObject<Float32Array | null>;
  /** 1 where a stitch has been worked, 0 where it has not. */
  worked: React.MutableRefObject<Float32Array | null>;
  reducedMotion: boolean;
}

/** Wool not yet knitted: the pale ghost of the pattern ahead of you. */
const unworked = new THREE.Color("#d8d2cb");

/*
 * Scratch objects, reused every frame. With thousands of stitches, allocating
 * per stitch per frame is what makes this kind of loop crawl.
 */
const position = new THREE.Vector3();
const neighbourAcross = new THREE.Vector3();
const neighbourBelow = new THREE.Vector3();
const across = new THREE.Vector3();
const up = new THREE.Vector3();
const normal = new THREE.Vector3();
const outward = new THREE.Vector3();
const basis = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();
const scale = new THREE.Vector3(1, 1, 1);
const matrix = new THREE.Matrix4();
const colour = new THREE.Color();

/** How fast a stitch fades in once it has been worked, per second. */
const fadeRate = 3.5;

/**
 * Draws every stitch as one instanced mesh.
 *
 * This replaces one mesh and one shader material per stitch, which for a
 * 160-stitch hat meant several thousand draw calls a frame and as many shader
 * programs. Instancing makes it a single draw call.
 *
 * Each stitch is oriented from its own neighbours rather than being pointed at
 * the middle of the hat. Taking the vector across the round and the vector
 * down to the round below gives the real surface normal, which is what makes
 * the fabric sit flat at the crown as well as at the sides.
 *
 * Worked stitches ease into their wool rather than snapping, so ticking off a
 * run of stitches reads as colour spreading across the hat.
 */
const StitchInstances: React.FC<StitchInstancesProps> = ({
  stitches,
  settled,
  moving,
  stitchRefs,
  colours,
  worked,
  reducedMotion,
}) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createStitchGeometry(), []);
  const eased = useRef<Float32Array>();

  useEffect(() => () => geometry.dispose(), [geometry]);

  const drawn = useMemo(
    () => stitches.filter((stitch) => stitch.id !== 0),
    [stitches],
  );

  /**
   * For each drawn stitch: which stitch is beside it in the round, and which
   * is below it. Worked out once, since the links never change.
   */
  const neighbours = useMemo(() => {
    const acrossOf = new Int32Array(drawn.length);
    const belowOf = new Int32Array(drawn.length);
    drawn.forEach((stitch, index) => {
      const links = stitch.links;
      // The last link is the previous stitch in the same round.
      acrossOf[index] = links.length > 0 ? links[links.length - 1] : -1;
      // Everything before it belongs to the round below; take the middle one,
      // matching how the chart anchors a stitch. An increase has none.
      const below = links.slice(0, -1);
      belowOf[index] = below.length > 0 ? below[Math.floor(below.length / 2)] : -1;
    });
    return { acrossOf, belowOf };
  }, [drawn]);

  const readPosition = (id: number, into: THREE.Vector3): boolean => {
    if (id < 0) return false;
    const resting = settled?.[id];
    const body = settled ? undefined : stitchRefs.current[id]?.current;
    const at = body?.translation() ?? resting ?? stitches[id]?.position;
    if (!at) return false;
    into.set(at.x, at.y, at.z);
    return true;
  };

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const target = colours.current;
    const done = worked.current;
    if (!eased.current || eased.current.length !== drawn.length) {
      eased.current = new Float32Array(drawn.length);
      // A hat opened with progress already on it starts there, rather than
      // fading in everything that was knitted weeks ago.
      if (done) eased.current.set(done);
    }

    let settling = false;
    for (let index = 0; index < drawn.length; index++) {
      const stitch = drawn[index];
      if (!readPosition(stitch.id, position)) continue;

      // Across the round, and down to the round below. Either may be missing
      // at the cast-on or at an increase, so fall back to something sane.
      const hasAcross = readPosition(neighbours.acrossOf[index], neighbourAcross);
      const hasBelow = readPosition(neighbours.belowOf[index], neighbourBelow);

      if (hasAcross) across.subVectors(neighbourAcross, position);
      // Tangent of a circle about the Y axis.
      else across.set(-position.z, 0, position.x);
      if (across.lengthSq() < 1e-8) across.set(1, 0, 0);
      across.normalize();

      if (hasBelow) up.subVectors(position, neighbourBelow);
      else up.set(0, 1, 0);
      if (up.lengthSq() < 1e-8) up.set(0, 1, 0);
      up.normalize();

      normal.crossVectors(across, up);
      if (normal.lengthSq() < 1e-8) {
        normal.set(position.x, 0, position.z);
        if (normal.lengthSq() < 1e-8) normal.set(0, 0, 1);
      }
      normal.normalize();

      // Keep the face pointing away from the hat's axis rather than into it.
      outward.set(position.x, 0, position.z);
      if (outward.lengthSq() > 1e-8 && normal.dot(outward) < 0) {
        normal.negate();
        across.negate();
      }

      // Re-square the basis: up may not be perpendicular to across.
      up.crossVectors(normal, across).normalize();

      basis.makeBasis(across, up, normal);
      quaternion.setFromRotationMatrix(basis);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);

      if (target && done) {
        const wanted = done[index];
        const current = eased.current[index];
        const next = reducedMotion
          ? wanted
          : current + (wanted - current) * Math.min(delta * fadeRate, 1);
        if (Math.abs(next - wanted) > 0.002) settling = true;
        eased.current[index] = next;
        colour
          .setRGB(
            target[index * 3],
            target[index * 3 + 1],
            target[index * 3 + 2],
            THREE.SRGBColorSpace,
          )
          .lerpColors(unworked, colour, next);
        mesh.setColorAt(index, colour);
      } else {
        mesh.setColorAt(index, unworked);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    // Nothing is moving and nothing is fading, so there is nothing to redraw.
    void (moving || settling);
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, drawn.length]}
      frustumCulled={false}
    >
      <meshBasicMaterial toneMapped={false} side={THREE.DoubleSide} />
    </instancedMesh>
  );
};

export default StitchInstances;
