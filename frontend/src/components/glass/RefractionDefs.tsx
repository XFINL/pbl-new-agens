/**
 * 折射滤镜定义（全局挂载一次）：
 *   #gm-refract  大面板的背景位移折射（feTurbulence + feDisplacementMap）
 *   #gm-warp     按压时的微扭曲（更高频、更小位移）
 *
 * 仅在支持 backdrop-filter: url(...) 的 Chromium 系生效（见 lib/capability.ts）。
 */
export function RefractionDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" className="absolute">
      <defs>
        <filter id="gm-refract" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.010"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="2.2" result="softNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softNoise"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="gm-warp" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="1"
            seed="3"
            result="warpNoise"
          />
          <feGaussianBlur in="warpNoise" stdDeviation="0.6" result="softWarp" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softWarp"
            scale="9"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}