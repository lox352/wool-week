import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Stitch } from "../types/Stitch";
import { Point } from "../types/Point";
import { createStitchGeometry } from "./stitch-geometry";

interface StitchInstancesProps {
  stitches: Stitch[];
  /**
   * Where a stitch is, right now.
   *
   * A hat that has already been settled hands back fixed positions; one that
   * is still settling reads them off the physics bodies every frame. Keeping
   * that behind a callback is what lets this file - and so the whole of the
   * ordinary path through the site - know nothing about the physics engine.
   */
  positionAt: (id: number) => Point | undefined;
  moving: boolean;
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

/** How many stitches to place in one frame. See placedUpTo. */
const placeChunk = 2500;

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
  positionAt,
  moving,
  colours,
  worked,
  reducedMotion,
}) => {
  const invalidate = useThree((state) => state.invalidate);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const geometry = useMemo(() => createStitchGeometry(), []);
  const eased = useRef<Float32Array>();
  /**
   * How many stitches have been put where they belong.
   *
   * Placing ten thousand of them is about half a second of vector arithmetic,
   * which as a single frame is a visible lock-up, so it is done a few thousand
   * at a time and the mesh only draws as many as are ready. The hat arrives
   * over two or three frames instead of the page stopping dead for one.
   */
  const placedUpTo = useRef(0);
  /** Every stitch has reached its colour, so there is nothing left to ease. */
  const faded = useRef(false);

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

  /*
   * A different hat has to be placed again, and a change to what is knitted
   * has to be eased again. Both need frames to do it in, and the stage only
   * draws when it is asked to, so both ask.
   */
  useEffect(() => {
    placedUpTo.current = 0;
    invalidate();
  }, [drawn, positionAt, invalidate]);
  useEffect(() => {
    faded.current = false;
    invalidate();
  }, [colours, worked, invalidate, moving]);

  const readPosition = (id: number, into: THREE.Vector3): boolean => {
    if (id < 0) return false;
    const at = positionAt(id);
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

    /*
     * A settled hat's stitches never move again, so where they are is worked
     * out once. Redoing it every frame is ten thousand iterations of vector
     * arithmetic for an answer that cannot have changed, which on a phone is
     * the difference between a still picture you can turn and a hot one you
     * cannot.
     */
    const placing = moving || placedUpTo.current < drawn.length;
    const fading = target !== null && done !== null && !faded.current;
    if (!placing && !fading) return;

    /*
     * While settling, every stitch moves every frame and all of them have to
     * be done. While placing a hat that is already still, they can be done a
     * few thousand at a time.
     */
    const from = moving ? 0 : placedUpTo.current;
    const to = moving
      ? drawn.length
      : Math.min(drawn.length, placedUpTo.current + placeChunk);

    let settling = false;
    for (let index = placing ? from : 0; index < (placing ? to : drawn.length); index++) {
      const stitch = drawn[index];
      if (!readPosition(stitch.id, position)) continue;
      if (!placing) {
        // Only the colour is still changing, so skip straight to it.
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
        }
        continue;
      }

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

    if (placing) {
      mesh.instanceMatrix.needsUpdate = true;
      placedUpTo.current = moving ? drawn.length : to;
      // Draw only what is ready, so the unplaced ones are not all piled at the
      // origin while they wait their turn.
      mesh.count = placedUpTo.current;
      if (placedUpTo.current < drawn.length) invalidate();
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    faded.current = !settling;
    // Still easing, so there is another frame's worth of work to do.
    if (settling || moving) invalidate();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, drawn.length]}
      frustumCulled={false}
    >
      {/*
        A stitch is a closed tube, so its back faces are never the ones you
        see. Drawing one side halves what the GPU has to rasterise, and with
        ten thousand of them on screen that is worth having on a phone.
      */}
      <meshBasicMaterial toneMapped={false} side={THREE.FrontSide} />
    </instancedMesh>
  );
};

export default StitchInstances;
