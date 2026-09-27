import type { ReactNode } from "react";

import { AmbientBackdrop } from "../glass/AmbientBackdrop";
import { RefractionDefs } from "../glass/RefractionDefs";

/** 应用外壳：固定环境底 + 居中内容容器 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AmbientBackdrop />
      <RefractionDefs />
      <div className="mx-auto w-full max-w-[1320px] px-4 pb-16 pt-6 sm:px-6">{children}</div>
    </>
  );
}