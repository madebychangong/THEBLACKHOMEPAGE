import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Crown, MessageCircle, Search, ShieldCheck, Sparkles } from "lucide-react";
import { defaultCatalog } from "./data/defaultCatalog";
import { getLiveStats, getPublicCatalog } from "./services/api";
import type { CatalogData, LiveStats, PriceSection, TemplateStyle } from "./types";

const styleMeta: Record<TemplateStyle, { label: string; tone: string }> = {
  basic: { label: "기본", tone: "정돈된 기본 가격" },
  recommended: { label: "추천 강조", tone: "상담 유도 상품" },
  popular: { label: "인기 상품", tone: "조회가 많은 상품" },
  paused: { label: "품절/중지", tone: "잠시 중단된 상품" },
  event: { label: "이벤트 가격", tone: "한정/할인 상품" }
};

export default function App() {
  const [catalog, setCatalog] = useState<CatalogData>(defaultCatalog);
  const [stats, setStats] = useState<LiveStats>({
    talking: defaultCatalog.stats.talkingMin,
    today: defaultCatalog.stats.todayBase,
    totalConsults: defaultCatalog.stats.totalBase
  });

  useEffect(() => {
    let mounted = true;

    getPublicCatalog().then((data) => {
      if (!mounted) return;
      setCatalog(data);
      getLiveStats(data.stats).then((nextStats) => mounted && setStats(nextStats));
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      getLiveStats(catalog.stats).then(setStats);
    }, 14_000);

    return () => window.clearInterval(timer);
  }, [catalog.stats]);

  useEffect(() => {
    bootChannelTalk(catalog.site.channelTalkPluginKey);
  }, [catalog.site.channelTalkPluginKey]);

  return <Storefront catalog={catalog} stats={stats} />;
}

function Storefront({ catalog, stats }: { catalog: CatalogData; stats: LiveStats }) {
  const [activeSection, setActiveSection] = useState("all");
  const [query, setQuery] = useState("");

  const visibleSections = useMemo(
    () =>
      catalog.sections
        .filter((section) => section.visible)
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.visible)
        }))
        .filter((section) => section.items.length > 0),
    [catalog.sections]
  );

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return visibleSections
      .filter((section) => activeSection === "all" || section.id === activeSection)
      .map((section) => {
        if (!normalizedQuery) return section;
        return {
          ...section,
          items: section.items.filter((item) =>
            [section.title, section.subtitle, item.name, item.unit, item.price, item.badge]
              .join(" ")
              .toLowerCase()
              .includes(normalizedQuery)
          )
        };
      })
      .filter((section) => section.items.length > 0);
  }, [activeSection, query, visibleSections]);

  useEffect(() => {
    if (activeSection === "all") return;
    if (!visibleSections.some((section) => section.id === activeSection)) {
      setActiveSection("all");
    }
  }, [activeSection, visibleSections]);

  const openChannel = () => {
    if (window.ChannelIO) {
      window.ChannelIO("showMessenger");
      return;
    }
    if (catalog.site.kakaoOpenChatUrl) {
      window.open(catalog.site.kakaoOpenChatUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openKakao = () => {
    if (!catalog.site.kakaoOpenChatUrl) return;
    window.open(catalog.site.kakaoOpenChatUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="site-shell">
      <section className="hero-section">
        <img className="hero-image" src="/hero-blackshop.png" alt="" aria-hidden="true" />
        <div className="hero-shade" />
        <header className="topbar">
          <a className="brand" href="/">
            <span className="brand-mark">
              <img src="/logo.png" alt="" />
            </span>
            <span>THE BLACK SHOP</span>
          </a>
          <nav className="top-actions" aria-label="상담 링크">
            <button className="ghost-button" type="button" onClick={openKakao}>
              <MessageCircle size={17} />
              카카오
            </button>
            <button className="solid-button" type="button" onClick={openChannel}>
              <ShieldCheck size={17} />
              상담
            </button>
          </nav>
        </header>

        <div className="hero-content">
          <div className="eyebrow">
            <Sparkles size={16} />
            {catalog.hero.eyebrow}
          </div>
          <h1>{catalog.hero.title}</h1>
          <p>{catalog.hero.subtitle}</p>
          <div className="hero-buttons">
            <button className="primary-cta" type="button" onClick={openChannel}>
              <MessageCircle size={19} />
              {catalog.hero.primaryCta}
            </button>
            <button className="secondary-cta" type="button" onClick={openKakao}>
              <BadgeCheck size={18} />
              {catalog.hero.secondaryCta}
            </button>
          </div>
        </div>
      </section>

      <section className="stats-band" aria-label="상담 현황">
        <StatItem label="현재 상담" value={stats.talking.toLocaleString()} unit="명" live />
        <StatItem label="오늘 문의" value={stats.today.toLocaleString()} unit="건" />
        <StatItem label="누적 상담" value={stats.totalConsults.toLocaleString()} unit="건" />
      </section>

      <section className="price-section" id="prices">
        <div className="section-heading">
          <div>
            <p className="section-kicker">PRICE BOARD</p>
            <h2>실시간 가격표</h2>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="상품 검색"
              aria-label="상품 검색"
            />
          </div>
        </div>

        <div className="category-tabs" aria-label="가격표 카테고리">
          <button
            className={activeSection === "all" ? "active" : ""}
            type="button"
            onClick={() => setActiveSection("all")}
          >
            전체
          </button>
          {visibleSections.map((section) => (
            <button
              key={section.id}
              className={activeSection === section.id ? "active" : ""}
              type="button"
              onClick={() => setActiveSection(section.id)}
            >
              {section.title}
            </button>
          ))}
        </div>

        <div className="price-grid">
          {filteredSections.map((section) => (
            <PriceSectionView key={section.id} section={section} />
          ))}
        </div>
      </section>
    </main>
  );
}

function StatItem({
  label,
  value,
  unit,
  live = false
}: {
  label: string;
  value: string;
  unit: string;
  live?: boolean;
}) {
  return (
    <div className="stat-item">
      <span className={live ? "stat-pulse" : "stat-icon"} />
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <span className="stat-unit">{unit}</span>
    </div>
  );
}

function PriceSectionView({ section }: { section: PriceSection }) {
  return (
    <article className={`price-card tone-${section.style}`}>
      <div className="price-card-head">
        <div>
          <p>{styleMeta[section.style].label}</p>
          <h3>{section.title}</h3>
          <span>{section.subtitle}</span>
        </div>
        <Crown size={22} />
      </div>
      <div className="price-rows">
        {section.items.map((item) => (
          <div className={`price-row tone-${item.style}`} key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <span>{item.unit}</span>
            </div>
            <div className="price-row-right">
              {item.badge && <em>{item.badge}</em>}
              <b>{item.price}</b>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function bootChannelTalk(pluginKey: string) {
  if (!pluginKey || typeof window === "undefined") return;

  const alreadyLoaded = Boolean(window.ChannelIO);

  if (!window.ChannelIO) {
    const channel = function (...args: unknown[]) {
      (channel.q = channel.q || []).push(args);
    } as ((...args: unknown[]) => void) & { q?: unknown[][] };
    channel.q = [];
    window.ChannelIO = channel;
  }

  if (!window.ChannelIOInitialized) {
    window.ChannelIOInitialized = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cdn.channel.io/plugin/ch-plugin-web.js";
    document.head.appendChild(script);
  }

  if (alreadyLoaded) {
    window.ChannelIO("shutdown");
  }
  window.ChannelIO("boot", { pluginKey });
}
