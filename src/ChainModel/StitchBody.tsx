import { BallCollider, RapierRigidBody, RigidBody } from "@react-three/rapier";
import { Point } from "../types/Point";
import React from "react";
import { settleDamping } from "../constants";
import { stitchCollisions } from "./tuning";

/**
 * One stitch as a physical body, and nothing else.
 *
 * It used to carry its own mesh and shader material, which meant thousands of
 * draw calls and shader programs. Drawing is now done in a single instanced
 * mesh (see StitchInstances) that reads these bodies' positions, so this is
 * purely the physics.
 */
export default function StitchBody({
  position,
  rigidBodyRef,
  fixed,
  damping = settleDamping,
  radius = 0.02,
}: {
  position: Point;
  rigidBodyRef: React.RefObject<RapierRigidBody>;
  fixed: boolean;
  damping?: number;
  radius?: number;
}) {
  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      collisionGroups={stitchCollisions}
      type={fixed ? "fixed" : "dynamic"}
      position={[position.x, position.y, position.z]}
      linearDamping={damping}
      angularDamping={damping}
    >
      <BallCollider args={[radius]} />
    </RigidBody>
  );
}
