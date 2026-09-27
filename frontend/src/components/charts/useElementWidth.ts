import { useEffect, useRef, useState } from "react";

/** 测量元素内容宽度（图表按真实像素绘制，避免描边被拉伸） */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setWidth(node.clientWidth || fallback);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fallback]);

  return { ref, width };
}