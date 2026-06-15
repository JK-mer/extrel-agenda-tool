import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Masonry packing for a CSS grid. Measures the natural height of the tile's
 * content and returns how many grid rows it should span, so tiles of different
 * lengths pack tightly with no gaps below a short tile.
 *
 * Measured both synchronously before paint (so content changes like sleeping an
 * item reflow immediately, with no transient overlap) and via ResizeObserver
 * (for async changes such as web-font loading).
 *
 * The unit / gap values must match `--row-unit` and `--gap` in index.css and
 * `grid-auto-rows` / `gap` on `.board`.
 */
const ROW_UNIT = 6;
const GAP = 18;

export function useRowSpan<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [span, setSpan] = useState(24);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const h = el.getBoundingClientRect().height + 2; // + section border
    const next = Math.max(1, Math.ceil((h + GAP) / (ROW_UNIT + GAP)));
    setSpan((prev) => (prev === next ? prev : next));
  }, []);

  // Runs after every render, before paint — keeps the span in sync with content.
  useLayoutEffect(measure);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return { ref, span };
}
