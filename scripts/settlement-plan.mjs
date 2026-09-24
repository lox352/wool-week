import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "vite";

export const manifestPath = "scripts/settlement-manifest.json";
const sources = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  return entry.isDirectory() ? sources(path) : /\.(ts|tsx)$/.test(path) && !path.includes(".test.") ? [path] : [];
});

/** Hash physics and geometry inputs, not just the presence of a chart file. */
export async function settlementPlan() {
  const vite = await createServer({ server: { middlewareMode: true }, optimizeDeps: { noDiscovery: true, include: [] } });
  try {
    const { hats } = await vite.ssrLoadModule("/src/data/hats/index.ts");
    const { buildHat } = await vite.ssrLoadModule("/src/knitting/engine.ts");
    const shared = ["src/constants.ts", "package-lock.json", ...sources("src/ChainModel"),
      "src/helpers/settling.ts", ...sources("src/types")]
      .sort().map(path => readFileSync(path, "utf8")).join("\n");
    const manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, "utf8")) : {};
    const files = readdirSync("src/data/hats/settled");
    return hats.map(hat => {
      const geometry = hat.sizes.map(size => ({ size: size.id, ...buildHat(hat, size.id) }));
      const fingerprint = createHash("sha256").update(shared).update(JSON.stringify(geometry)).digest("hex");
      const sized = files.some(file => file.startsWith(`${hat.id}--`));
      const covered = geometry.every(({ size, stitches }) => {
        const path = `src/data/hats/settled/${hat.id}${sized ? `--${size}` : ""}.json`;
        if (!existsSync(path)) return false;
        const flat = JSON.parse(readFileSync(path, "utf8"));
        return flat.length === stitches.length * 3 && flat.every(Number.isFinite);
      });
      return { id: hat.id, sizes: hat.sizes.map(size => size.id), fingerprint,
        needed: !covered || manifest[hat.id] !== fingerprint };
    });
  } finally { await vite.close(); }
}

if (process.argv[1]?.endsWith("settlement-plan.mjs")) {
  const plan = await settlementPlan();
  const needed = plan.filter(target => target.needed);
  console.log(needed.length ? needed.map(target => target.id).join(" ") : "All hat sizes have current geometry.");
  if (process.argv.includes("--check") && needed.length) process.exitCode = 1;
}
