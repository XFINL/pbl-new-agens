/**
 * 能力探测：玻璃拟态的渐进增强开关。
 *
 * backdrop-filter 使用 SVG 滤镜（url(#id)）在 Chromium 上可用；
 * 其他内核即使语法解析通过，也可能整条声明失效导致玻璃"失去模糊"，
 * 因此这里用 UA 白名单把高级折射限制在 Chromium 系。
 */

let cached: boolean | null = null;

export function supportsRefractionFilter(): boolean {
  if (cached !== null) return cached;
  cached = false;
  try {
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return cached;
    if (!CSS.supports("backdrop-filter", "url(#gm-refract)")) return cached;
    if (typeof navigator === "undefined") return cached;
    cached = /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent);
  } catch {
    cached = false;
  }
  return cached;
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* 降级到 execCommand */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "true");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}