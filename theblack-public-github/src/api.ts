import { defaultCatalog } from "../data/defaultCatalog";
import type { CatalogData, LiveStats, PublicCatalog, StatsConfig } from "../types";

const LOCAL_CATALOG_KEY = "theblack-homepage.catalog.v1";

export async function getPublicCatalog(): Promise<CatalogData> {
  try {
    const response = await fetch("/api/catalog", {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error("catalog api unavailable");
    const publicData = (await response.json()) as PublicCatalog;
    return {
      ...defaultCatalog,
      ...publicData,
      stats: defaultCatalog.stats
    };
  } catch {
    return readLocalCatalog() ?? defaultCatalog;
  }
}

export async function getLiveStats(statsConfig: StatsConfig): Promise<LiveStats> {
  try {
    const response = await fetch("/api/stats", {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) throw new Error("stats api unavailable");
    return (await response.json()) as LiveStats;
  } catch {
    return buildLocalStats(statsConfig);
  }
}

function readLocalCatalog(): CatalogData | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(LOCAL_CATALOG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CatalogData;
  } catch {
    return null;
  }
}

function buildLocalStats(config: StatsConfig): LiveStats {
  const now = new Date();
  const start = new Date(config.startedAt);
  const elapsedDays = Number.isFinite(start.getTime())
    ? Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000))
    : 0;
  const hourLift = now.getHours() * 11 + Math.floor(now.getMinutes() / 10) * 3;
  const talkingRange = Math.max(1, config.talkingMax - config.talkingMin + 1);
  const talking = config.talkingMin + ((now.getMinutes() + now.getHours() * 7) % talkingRange);
  const today = config.todayBase + hourLift;
  const totalConsults = config.totalBase + elapsedDays * config.dailyGrowth + today;

  return { talking, today, totalConsults };
}
