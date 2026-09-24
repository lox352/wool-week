import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { hats } from "../data/hats";
import WoolList from "./WoolList";
it("does not promise original ball counts for replacement yarn", () => {
  const hat = hats[0];
  const html = renderToStaticMarkup(<WoolList colourway={hat.colourways[0]} sizeId={hat.sizes[0].id}
    overrides={{ A: { name: "Own", hex: "#000000" } }} onChange={() => {}} onRestoreAll={() => {}} />);
  expect(html).toContain("quantity not calculated");
  expect(html).toContain("combining colours also combines");
});
