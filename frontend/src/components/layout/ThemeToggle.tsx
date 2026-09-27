import { PixelGlassSwitch } from "./PixelGlassSwitch";

/** 主题切换：玻璃开关（太阳/月亮等图标一律不用，仅用黑白几何与文字） */
export function ThemeToggle({ theme, onToggle }: { theme: "light" | "dark"; onToggle: () => void }) {
  const isDark = theme === "dark";
  return (
    <PixelGlassSwitch
      checked={isDark}
      onToggle={onToggle}
      labels={{ on: "深色", off: "浅色" }}
      ariaLabel={`当前为${isDark ? "深色" : "浅色"}主题，点击切换`}
    />
  );
}