/*
 * What holds two stitches together.
 *
 * A rope joint says they may come no further apart than the yarn between them
 * allows, and says nothing at all about them coming closer. That is a fair
 * account of yarn, and a poor account of knitted fabric: a stitch is a loop
 * through a loop, and squashing a round pushes the loops against each other.
 * With nothing to push back, a hat built with every joint already taut can
 * only settle smaller than it was built, in whichever direction the force is
 * not pulling - which is why it goes limp.
 *
 * A spring joint has a length it wants to be and pulls back either way. It
 * costs a stiffness and a damping to tune, and an unstable pair of those will
 * shake a hat to pieces rather than settle it, so both are kept side by side
 * and chosen from the query string.
 */
import { useRopeJoint, useSpringJoint, RapierRigidBody } from "@react-three/rapier";

interface LinkProps {
  bodyA: React.RefObject<RapierRigidBody>;
  bodyB: React.RefObject<RapierRigidBody>;
  /** The length the yarn between them allows, or wants. */
  length: number;
  stiffness: number;
  damping: number;
}

const centre: [number, number, number] = [0, 0, 0];

export function RopeLink({ bodyA, bodyB, length }: LinkProps) {
  useRopeJoint(bodyA, bodyB, [centre, centre, length]);
  return null;
}

export function SpringLink({
  bodyA,
  bodyB,
  length,
  stiffness,
  damping,
}: LinkProps) {
  useSpringJoint(bodyA, bodyB, [centre, centre, length, stiffness, damping]);
  return null;
}
