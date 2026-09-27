/**
 * 环境底：玻璃必须有"可折射的材质"。
 * 固定定位的黑白灰阶光斑 + 极淡网格 + 噪点，位于所有内容之下。
 */
export function AmbientBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* 灰阶光斑（深浅主题各一组，见 --ambient-* token） */}
      <div
        className="gm-drift absolute left-[-12%] top-[-18%] h-[62vh] w-[62vh] rounded-full"
        style={{
          background: "radial-gradient(circle at 38% 38%, var(--ambient-a), transparent 68%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="gm-drift-slow absolute right-[-10%] top-[6%] h-[48vh] w-[48vh] rounded-full"
        style={{
          background: "radial-gradient(circle at 60% 40%, var(--ambient-b), transparent 70%)",
          filter: "blur(36px)",
        }}
      />
      <div
        className="gm-drift absolute bottom-[-22%] left-[24%] h-[70vh] w-[70vh] rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 50%, var(--ambient-c), transparent 72%)",
          filter: "blur(40px)",
          animationDelay: "-8s",
        }}
      />
      {/* 网格 */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* 噪点 */}
      <div className="gm-noise absolute inset-0" />
    </div>
  );
}