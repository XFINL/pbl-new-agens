import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEventHandler,
  type PointerEventHandler,
} from "react";

/** 最大微倾斜幅度（度）——按压点越靠边，玻璃朝该点陷得越深 */
const MAX_TILT_DEG = 1.2;
/** 释放回弹动画时长，与 CSS gm-settle 保持一致 */
const SETTLE_MS = 320;

export interface PressHandlers {
  onPointerDown: PointerEventHandler<HTMLElement>;
  onPointerUp: PointerEventHandler<HTMLElement>;
  onPointerCancel: PointerEventHandler<HTMLElement>;
  onKeyDown: KeyboardEventHandler<HTMLElement>;
  onKeyUp: KeyboardEventHandler<HTMLElement>;
}

export interface PressControls {
  pressed: boolean;
  releasing: boolean;
  /** 挂到元素上的 ref 回调 */
  setNode: (node: HTMLElement | null) => void;
  /** 展开到元素上的事件处理器 */
  pressProps: PressHandlers;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 按压交互：把按压点写入 CSS 变量，驱动「涟漪中心 + 微倾斜 + 压缩 + 释放回弹」。
 *
 * 写入的变量：
 *   --px / --py  按压点位置（%）→ 涟漪中心
 *   --rx / --ry  倾斜角（deg）→ 玻璃朝按压点凹陷
 */
export function usePress(options: { disabled?: boolean } = {}): PressControls {
  const { disabled = false } = options;
  const nodeRef = useRef<HTMLElement | null>(null);
  const settleTimer = useRef<number | null>(null);
  const [pressed, setPressed] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(
    () => () => {
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    },
    []
  );

  const setNode = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  const applyPoint = useCallback((clientX: number, clientY: number, centered = false) => {
    const node = nodeRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = centered || !rect.width ? 50 : clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
    const py = centered || !rect.height ? 50 : clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
    const rx = (0.5 - py / 100) * 2 * MAX_TILT_DEG;
    const ry = (px / 100 - 0.5) * 2 * MAX_TILT_DEG;
    node.style.setProperty("--px", `${px.toFixed(2)}%`);
    node.style.setProperty("--py", `${py.toFixed(2)}%`);
    node.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
    node.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
  }, []);

  const release = useCallback(() => {
    setPressed(false);
    setReleasing(true);
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setReleasing(false), SETTLE_MS);
  }, []);

  const pressProps: PressHandlers = {
    onPointerDown: (event) => {
      if (disabled || event.button !== 0) return;
      applyPoint(event.clientX, event.clientY);
      setReleasing(false);
      setPressed(true);
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        /* 部分环境不支持指针捕获 */
      }
    },
    onPointerUp: () => {
      if (pressed) release();
    },
    onPointerCancel: () => {
      if (pressed) release();
    },
    onKeyDown: (event) => {
      if (disabled) return;
      if (event.key === " " || event.key === "Enter") {
        if (!pressed) {
          applyPoint(0, 0, true);
          setPressed(true);
        }
        if (event.key === " ") event.preventDefault();
      }
    },
    onKeyUp: (event) => {
      if (event.key === " " || event.key === "Enter") {
        if (pressed) release();
      }
    },
  };

  return { pressed, releasing, setNode, pressProps };
}