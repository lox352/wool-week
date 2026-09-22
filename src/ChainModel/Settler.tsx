import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RapierRigidBody, useRapier } from "@react-three/rapier";
import { createRestDetector, SettleMetrics } from "../helpers/settling";
import { Tuning } from "./tuning";
import { Point } from "../types/Point";
import { adjacentStitchDistance } from "../constants";
interface SettlerProps {
  active: boolean;
  tuning: Tuning;
  stitchRefs: React.MutableRefObject<React.RefObject<RapierRigidBody>[]>;
  /** Called once, with every stitch's resting position, when the hat is still. */
  onSettled: (positions: Point[], metrics: SettleMetrics) => void;
}

/**
 * Drives the physics world while the hat is settling, and says when it has.
 *
 * Rapier's Physics component is left paused so it never steps on its own. Its
 * two built-in modes both derive the step from real elapsed time - "vary" uses
 * the frame delta directly, and a fixed timeStep runs an accumulator against
 * the clock - which means the number of steps taken depends on how fast the
 * machine renders. Stepping here instead gives the same simulation on every
 * machine.
 *
 * Rest is judged after every step, in simulated time rather than wall time,
 * for the same reason: "quiet for two seconds" has to mean two seconds of the
 * hat's time, however many frames that took to draw.
 *
 * step() comes from the Rapier context and does the world step and the mesh
 * sync together, so the stitches follow along as they move.
 */
/**
 * Push every stitch away from the hat's axis.
 *
 * Given as an acceleration, so it reads against gravity, and re-applied each
 * step because Rapier keeps a force until it is cleared and because a stitch
 * that has moved wants its push in a new direction.
 *
 * A stitch on the axis has no direction to be pushed in, which is only ever
 * the last stitch of the crown, and it is left where it is.
 */
const inflate = (
  refs: React.RefObject<RapierRigidBody>[],
  pressure: number,
) => {
  for (const ref of refs) {
    const body = ref.current;
    if (!body || body.isFixed()) continue;
    const at = body.translation();
    const out = Math.hypot(at.x, at.z);
    body.resetForces(false);
    if (out < 1e-6) continue;
    const force = pressure * body.mass();
    body.addForce({ x: (at.x / out) * force, y: 0, z: (at.z / out) * force }, true);
  }
};

export default function Settler({
  active,
  stitchRefs,
  onSettled,
  tuning,
}: SettlerProps) {
  const { step } = useRapier();
  const rest = useRef(createRestDetector(tuning));
  const complete = useRef(false);
  const count = useRef(0);
  const started = useRef(0);
  /** Where everything was a step ago, so how far it moved can be measured. */
  const was = useRef<Float32Array | null>(null);

  useFrame(() => {
    if (
      !active ||
      complete.current ||
      stitchRefs.current.some((r) => !r.current)
    )
      return;
    if (!started.current) started.current = performance.now();
    const deadline = performance.now() + tuning.stepBudgetMs;
    for (let i = 0; i < tuning.substeps; i++) {
      if (tuning.pressure !== 0) inflate(stitchRefs.current, tuning.pressure);
      step(tuning.timeStep);
      count.current++;

      const bodies = stitchRefs.current;
      if (!was.current) was.current = new Float32Array(bodies.length * 3);
      const before = was.current;

      let motion = 0;
      let moved = 0;
      for (let index = 0; index < bodies.length; index++) {
        const body = bodies[index]!.current!;
        const v = body.linvel();
        motion += Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z);

        /*
         * And how far it actually went, which is the question a rest
         * detector is really asking. Velocity is only a guess at it: a hat
         * can carry a lot of small velocities that cancel and go nowhere,
         * and it can creep somewhere on very little.
         */
        const at = body.translation();
        const base = index * 3;
        moved += Math.hypot(
          at.x - before[base],
          at.y - before[base + 1],
          at.z - before[base + 2],
        );
        before[base] = at.x;
        before[base + 1] = at.y;
        before[base + 2] = at.z;
      }
      const meanMotion = motion / bodies.length;
      const meanMoved = count.current === 1 ? Infinity : moved / bodies.length;
      /*
       * Progress, for scripts/settle-hats.mjs, which is the only thing that
       * ever runs this: a step over ten thousand bodies takes a second or two,
       * so a run takes minutes and deserves to say how it is getting on.
       */
      (window as unknown as { __settleProgress?: unknown }).__settleProgress = {
        steps: count.current,
        motion: meanMotion,
        /** Mean distance a stitch travelled this step, in stitch widths. */
        moved: meanMoved / adjacentStitchDistance,
      };
      if (rest.current(meanMotion)) {
        complete.current = true;
        const positions = stitchRefs.current.map((r) =>
          r.current!.translation(),
        );
        onSettled(positions, {
          steps: count.current,
          wallMs: performance.now() - started.current,
          height: Math.max(...positions.map((p) => p.y)),
          meanMotion,
        });
        break;
      }
      if (performance.now() >= deadline) break;
    }
  });
  return null;
}
