import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Opens every new page at the top.
 *
 * A single-page app keeps the window's scroll position across a route change,
 * so choosing a hat half way down the list would open it half way down its own
 * page. Only forward navigation is reset: going back is left to the browser,
 * which puts you where you were on the list.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const type = useNavigationType();
  useLayoutEffect(() => {
    if (type !== "POP") window.scrollTo(0, 0);
  }, [pathname, type]);
  return null;
}
