import type { Config } from "tailwindcss";

// 颜色全部走 CSS 变量（见 src/styles/index.css），组件层只引用语义色名
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        fg: "var(--fg)",
        muted: "var(--fg-muted)",
        faint: "var(--fg-faint)",
        line: "var(--line)",
        solid: "var(--surface-solid)",
        glass: "var(--glass-tint)",
        edge: "var(--glass-edge)",
      },
      borderRadius: {
        panel: "18px",
        control: "12px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["12px", "16px"],
        xs: ["13px", "18px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        lg: ["20px", "28px"],
        metric: ["30px", "34px"],
      },
      transitionTimingFunction: {
        soft: "cubic-bezier(.22,1,.36,1)",
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
} satisfies Config;