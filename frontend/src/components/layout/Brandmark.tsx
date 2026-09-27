/** 品牌字标：CSS 绘制的方块标记 + 文字（全站唯一"标记"，不使用任何图标） */
export function Brandmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="relative inline-block h-4 w-4 rounded-[4px] border border-fg"
        >
          <span className="absolute left-[2px] top-[2px] h-[5px] w-[5px] rounded-[1px] bg-fg" />
          <span className="absolute bottom-[2px] right-[2px] h-[3px] w-[3px] rounded-[1px] bg-fg opacity-60" />
        </span>
        <span className="text-sm font-semibold tracking-[0.01em] text-fg">流量台</span>
      </span>
    </span>
  );
}