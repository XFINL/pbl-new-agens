# 流量台 Glassmeter · 设计规范（玻璃拟态 / 黑白单色）

## 1. 设计原则

1. **单色**：全站只用黑、白、灰阶。禁止任何彩色（含状态色；成功/危险语义用「实心黑 / 空心描边 / 加粗」区分）。
2. **玻璃拟态**：所有容器都是有厚度的玻璃——能折射背景、有镜面反射、有边缘与泛光、有外圈光晕。
3. **零图标**：不使用 emoji、图标字体、图标 SVG、图片素材。所有"图标位"用**文字标签、数字、CSS 纯几何形状（点/线/方块）**表达。
4. **信息密度优先**：数据看板以数字和排版为主体，装饰克制。
5. **动效物理感**：玻璃是软的——按压有压缩、涟漪与微扭曲，释放有回弹。

## 2. 主题 Token（CSS 变量，挂在 `:root` / `.dark`）

### 2.1 基础色板（灰度）

| Token | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `--bg` | `#f2f2f3` | `#08080a` | 页面底色 |
| `--fg` | `#0a0a0b` | `#fafafa` | 主文字 |
| `--fg-muted` | `#6b6b70` | `#a1a1a8` | 次级文字 |
| `--fg-faint` | `#9b9ba1` | `#6e6e76` | 辅助/坐标轴 |
| `--line` | `rgba(0,0,0,.10)` | `rgba(255,255,255,.12)` | 分隔线/网格 |
| `--surface-solid` | `#ffffff` | `#131316` | 非玻璃实心面（下拉/表格斑马） |

### 2.2 玻璃材质 Token

| Token | 浅色 | 深色 |
| --- | --- | --- |
| `--glass-tint` | `rgba(255,255,255,.55)` | `rgba(24,24,27,.42)` |
| `--glass-blur` | `20px`（面板 12px / 大面板 36px） | 同 |
| `--glass-sat` | `160%` | `150%` |
| `--glass-bright` | `1.06` | `1.10` |
| `--glass-edge`（外描边） | `rgba(255,255,255,.70)` | `rgba(255,255,255,.14)` |
| `--bevel-top`（顶部倒角高光） | `rgba(255,255,255,.90)` | `rgba(255,255,255,.24)` |
| `--rim-inner`（内描边） | `rgba(0,0,0,.06)` | `rgba(255,255,255,.08)` |
| `--spec-a`（镜面高光主色） | `rgba(255,255,255,.85)` | `rgba(255,255,255,.30)` |
| `--halo`（外光晕） | `0 20px 44px -26px rgba(0,0,0,.30)` | `0 24px 60px -32px rgba(0,0,0,.95)` |
| `--halo-glow`（泛光附加） | `0 0 44px -20px rgba(255,255,255,.9)` | `0 0 52px -18px rgba(255,255,255,.16)` |
| `--rim-glow`（边缘泛光，hover/focus） | `0 0 0 1px rgba(0,0,0,.18), 0 0 26px -6px rgba(0,0,0,.22)` | `0 0 0 1px rgba(255,255,255,.30), 0 0 30px -6px rgba(255,255,255,.32)` |
| `--press-ripple` | `rgba(255,255,255,.85)` | `rgba(255,255,255,.45)` |

### 2.3 几何与动效 Token

| Token | 值 |
| --- | --- |
| `--radius-panel` | `18px` |
| `--radius-control` | `12px` |
| `--ease-out-soft` | `cubic-bezier(.22,1,.36,1)` |
| `--dur-fast / --dur-base / --dur-slow` | `140ms / 200ms / 320ms` |

## 3. 玻璃材质分层结构（六效果实现）

每个玻璃元件由 **6 个图层**叠加组成（`.glass` 基底 + `::before` + `::after` + SVG 滤镜 + 环境底）：

```
┌─ 光晕 halo ──────────────── box-shadow 外层大范围柔光
│ ┌─ 边缘泛光 rim glow ────── hover/focus: 1px 外扩亮边 + 外发光
│ │ ┌─ 边缘 edge ─────────── 1px 半透明描边 + 内描边 + 顶部倒角高光
│ │ │ ┌─ 反射 reflection ─── 118° 线性镜面 + 底部次级反光（::before）
│ │ │ │ ┌─ 折射 refraction ─ backdrop-filter blur+saturate+brightness
│ │ │ │ │                    （高级：SVG feTurbulence+feDisplacementMap）
│ │ │ │ │ ┌─ 内容 content ── 文字/数字/图表
│ │ │ │ │ │
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
```

### 3.1 折射 refraction

- 基础（全浏览器）：
  ```css
  background: var(--glass-tint);
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-sat)) brightness(var(--glass-bright));
  -webkit-backdrop-filter: 同上;
  ```
- 高级（Chromium 渐进增强）：真实位移折射，用 SVG 滤镜扭曲**背景**：
  ```html
  <filter id="gm-refract">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.010" numOctaves="2" seed="7" result="n"/>
    <feGaussianBlur in="n" stdDeviation="2.2"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  ```
  ```css
  @supports (backdrop-filter: url(#gm-refract)) {
    .glass-lg { backdrop-filter: url(#gm-refract) blur(4px) saturate(160%) brightness(1.06); }
  }
  ```
  仅用于**大面板**（面板 > 360px 宽），避免小控件性能损耗与边缘伪影；元素需 `border-radius` + `background-clip: padding-box` 抑制边缘拉伸。

### 3.2 反射 reflection

`::before` 双层线性渐变（`mix-blend-mode: screen`，`pointer-events:none`）：

- 主镜面：`linear-gradient(118deg, var(--spec-a) 0%, transparent 38%)` — 左上斜射高光
- 底反光：`linear-gradient(0deg, color-mix(in srgb, var(--spec-a) 45%, transparent) 0%, transparent 22%)` — 底部环境回光
- 与 `--bevel-top` 的内阴影配合，形成"上亮下透"的玻璃厚度感

### 3.3 边缘 edge

```css
border: 1px solid var(--glass-edge);
box-shadow: inset 0 1px 0 var(--bevel-top),   /* 顶部倒角 */
            inset 0 0 0 1px var(--rim-inner); /* 内轮廓，收敛边缘 */
```

### 3.4 边缘泛光 rim glow

仅 `:hover` / `:focus-visible` / `.is-pressed` 时叠加（`transition: box-shadow var(--dur-base)`），值见 `--rim-glow`：

- 浅色主题：描边加深 + 外圈暗色柔光（在浅底上是"被照亮"的错觉）
- 深色主题：描边增白 + 白色外发光（真正的泛光）
- 键盘聚焦时使用相同视觉 + `outline-offset: 2px` 保证可达性

### 3.5 光晕 halo

静态层：`box-shadow: var(--halo), var(--halo-glow)`。
规则：**玻璃越"贵"（面板 > 卡片 > 控件），光晕越大**；同一屏光晕数量上限 ~8 个，避免糊成一片。

### 3.6 按压 press（按压点涟漪 + 压缩 + 微扭曲 + 释放回弹）

由 `usePress` 钩子（pointerdown/pointerup/pointercancel/pointerleave）实现，写入 CSS 变量：

| 变量 | 含义 |
| --- | --- |
| `--px` / `--py` | 按压点相对元件的位置（%）→ 涟漪中心 |
| `--rx` / `--ry` | 按压点相对中心的方向 × 幅度 → 倾斜角（±1.2deg 内） |

状态与视觉分四拍：

1. **压下（0–140ms）**
   - `.is-pressed`：`transform: perspective(720px) rotateX(var(--rx)) rotateY(var(--ry)) scale(.985) translateY(1px)`
     → 玻璃朝按压点"陷进去"（微扭曲的体感来源之一）
   - `::after` 涟漪淡入：`radial-gradient(140px circle at var(--px) var(--py), var(--press-ripple), transparent 60%)`
   - 内阴影加深：`inset 0 6px 14px -8px rgba(0,0,0,.35)`（压下后的凹面感）
   - **微扭曲（Chromium）**：`@supports (backdrop-filter: url(#gm-warp))` 时，按下瞬间把 `backdrop-filter` 换成
     `url(#gm-warp) blur(...)`；`#gm-warp` 为 `feTurbulence(baseFrequency .02, scale 9)` 位移滤镜
     → 背景随按压产生细微"果冻"形变。降级方案（Safari/Firefox）：仅靠倾斜 + 压缩 + 涟漪表达
2. **保持（按住不放）**：涟漪衰减为常亮低透明度（`opacity .55`），倾斜保持
3. **释放（0–320ms）**：回弹关键帧 `scale .985 → 1.004 → 1`（`--ease-out-soft`），涟漪 260ms 淡出
4. **禁用/降级**：`prefers-reduced-motion: reduce` 时全部动效关闭（仅保留颜色变化）；`:disabled` 不进按压态

卡片、按钮、站点卡、代码块复制按钮、主题开关均接入同一个 `usePress`。

### 3.7 环境底 AmbientBackdrop（玻璃必须有东西可折射）

- 固定定位全屏层，位于所有内容之下：
  - 深浅主题各一组**灰阶** radial-gradient 光斑（`#ffffff/#d4d4d8` 或 `#1d1d22/#2a2a31`）
  - 叠加极淡网格线（1px，`--line` 同色系，40px 间距）+ `feTurbulence` 噪点 data-URI（`opacity .025`），避免大面积渐变的色带
- 内容滚动时背景静止（`position: fixed`），玻璃滑动经过光斑时折射效果自然变化

## 4. 组件清单（shadcn/ui 风格）

复制源码到 `frontend/src/components/ui/`，全部去掉图标依赖，玻璃化改造点统一如下：

| 组件 | 基于 | 玻璃化改造 |
| --- | --- | --- |
| `GlassPanel` / `Card` | div | 六效果全量；`GlassPanel` 支持 `size: sm\|md\|lg` 决定 blur 与光晕档位 |
| `GlassButton` | button + CVA | 变体：`solid`（实心黑/白）/ `glass`（玻璃）/ `ghost`（无底）；按压交互 + rim glow |
| `Input` / `Label` | input | 内陷玻璃（内阴影为主，反向 bevel）；focus 时边缘泛光 |
| `Dialog` | @radix-ui/react-dialog | 遮罩 `backdrop-blur(8px)` + 深灰；面板为 `size=lg` 玻璃，打开有 scale .97→1 入场 |
| `DropdownMenu` | @radix-ui/react-dropdown-menu | 实心面 + 强模糊（避免嵌套 backdrop-filter 堆叠开销） |
| `Tabs` | @radix-ui/react-tabs | 玻璃槽 + 实心滑块（黑白互换） |
| `Tooltip` | @radix-ui/react-tooltip | 小号玻璃 + 无箭头 |
| `Table` | table | 表头细分隔线，无斑马纹（用行 hover 的玻璃高亮替代） |
| `Badge` | span | 描边胶囊，仅黑白两态 |
| `Skeleton` | div | 灰阶脉冲（`prefers-reduced-motion` 下静态） |
| `Toast` | 自实现（`aria-live`） | 右下角玻璃条，3s 自动消失 |

## 5. 图表规范（手写 SVG，单色）

| 图 | 规范 |
| --- | --- |
| 面积折线 `AreaChart` | 主序列实线 1.5px + 面积 `linear-gradient(180deg, rgba(0,0,0,.10), transparent)`（深色主题反相）；网格仅水平线；`<defs><pattern>` 斜纹用于第二序列；悬停：竖直指示线 + 玻璃 tooltip（数值 + 日期） |
| 横向条形 `BarList` | 行 = 标签 + 数值 + 条形；条形用 `--fg` 不同透明度分档（100% / 70% / 45% / 25%），并列次要值用斜纹 |
| 环形 `Donut` | `stroke-dasharray` 绘制，5 档灰阶 + 2 档斜纹填充区分扇区；中心显示总量；扇区 hover 加亮描边 |
| 迷你线 `Sparkline` | 指标卡内 60×20 无坐标轴线图，仅趋势示意 |

系列区分顺序：**亮度 → 虚实 → 纹理**，绝不使用彩色。

## 6. 排版与数字

- 字体栈：`-apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- 等宽（代码/URL）：`ui-monospace, "SF Mono", Menlo, Consolas, monospace`
- 指标数字：`font-variant-numeric: tabular-nums`，`font-size: 30px / 700`，单位（如 %）用 `--fg-muted` 小号上标
- 字号阶梯：12 / 13 / 14 / 16 / 20 / 30px；标题 `letter-spacing: .01em`
- 面板标题结构：`标题（14px 600）+ 右侧范围/切换`，面板内边距 `20px`

## 7. 响应式

| 断点 | 布局 |
| --- | --- |
| `< 640px` | 单列；指标卡 2 列网格；顶栏折叠为两行 |
| `640–1024px` | 指标卡 3 列；趋势全宽；来源/设备各半宽 |
| `> 1024px` | 指标卡 5 列；趋势全宽；来源与设备各半宽；页面排行全宽 |

## 8. 可访问性

- 正文对比度 ≥ 4.5:1（`--fg` on 玻璃面按最差背景校验；浅色主题玻璃下的文字使用 `#0a0a0b`）
- 全部交互可达：Tab 顺序自然，`:focus-visible` 有 rim glow + outline
- `aria-live="polite"` 用于 toasts 与数据刷新；图表附带 `role="img"` + `aria-label` 文本摘要（数据表等价物）
- 动效可完全关闭：`prefers-reduced-motion` 全局降级
- 语义色不依赖颜色：上升/下降用「+/-」符号与文字，不用红绿

## 9. 禁用清单（实现与评审时逐条核对）

- 禁止 emoji 字符（😀 ✅ 🚀 等）
- 禁止图标字体（FontAwesome / iconfont 等）与图标 SVG（lucide / heroicons 等）
- 禁止图片素材（插图、纹理图、logo 位图）；品牌符号用纯 CSS 几何（如 `▪` 形状由 div 绘制）或用文字字标「流量台」
- 禁止彩色与彩色渐变
- 禁止 emoji 式状态表达（用文字："正常 / 异常"）

> 品牌字标：使用文字「流量台」+ 一个 CSS 绘制的方块标记（16×16，黑白反转，带 1px 描边），作为全站唯一"标记"。不引入任何图标。