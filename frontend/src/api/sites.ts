import { apiRequest } from "./client";

export interface Site {
  id: number;
  name: string;
  domain: string;
  public_key: string;
  created_at: string;
}

export function listSites(): Promise<Site[]> {
  return apiRequest<Site[]>("/api/sites");
}

export function createSite(name: string, domain: string): Promise<Site> {
  return apiRequest<Site>("/api/sites", { method: "POST", body: { name, domain } });
}

export function deleteSite(siteId: number): Promise<void> {
  return apiRequest<void>(`/api/sites/${siteId}`, { method: "DELETE" });
}

/** 生成埋点代码（平台地址取自当前访问地址，开发态与生产态均正确） */
export function buildSnippet(siteKey: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `<script defer src="${origin}/tracker.js" data-site="${siteKey}"></script>`;
}