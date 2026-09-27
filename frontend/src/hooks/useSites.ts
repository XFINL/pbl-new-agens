import { useCallback, useEffect, useState } from "react";

import { listSites, type Site } from "../api/sites";

interface SitesState {
  sites: Site[];
  loading: boolean;
  error: string | null;
}

/** 站点列表（列表页与看板顶栏共用） */
export function useSites() {
  const [state, setState] = useState<SitesState>({ sites: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const sites = await listSites();
      setState({ sites, loading: false, error: null });
    } catch (error) {
      setState({
        sites: [],
        loading: false,
        error: error instanceof Error ? error.message : "站点加载失败",
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}