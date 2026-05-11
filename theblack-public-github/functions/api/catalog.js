import { json } from "../_shared/response.js";
import { readCatalog } from "../_shared/store.js";

export async function onRequestGet({ env }) {
  const catalog = await readCatalog(env);
  return json(toPublicCatalog(catalog));
}

function toPublicCatalog(catalog) {
  return {
    site: {
      channelTalkPluginKey: cleanText(catalog.site?.channelTalkPluginKey, 120),
      kakaoOpenChatUrl: cleanText(catalog.site?.kakaoOpenChatUrl, 500)
    },
    hero: {
      eyebrow: cleanText(catalog.hero?.eyebrow, 60) || "PREMIUM ITEM DESK",
      title: cleanText(catalog.hero?.title, 80) || "THE BLACK SHOP",
      subtitle: cleanText(catalog.hero?.subtitle, 240),
      primaryCta: cleanText(catalog.hero?.primaryCta, 30) || "채널톡 상담",
      secondaryCta: cleanText(catalog.hero?.secondaryCta, 30) || "카카오 오픈채팅"
    },
    sections: normalizeSections(catalog.sections)
      .filter((section) => section.visible)
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => item.visible)
      }))
      .filter((section) => section.items.length > 0),
    updatedAt: cleanText(catalog.updatedAt, 80)
  };
}

function normalizeSections(sections = []) {
  if (!Array.isArray(sections)) return [];
  return sections.map((section) => ({
    id: cleanText(section.id, 80),
    title: cleanText(section.title, 60) || "가격 섹션",
    subtitle: cleanText(section.subtitle, 120),
    style: cleanStyle(section.style),
    visible: section.visible !== false,
    items: Array.isArray(section.items)
      ? section.items.map((item) => ({
          id: cleanText(item.id, 80),
          name: cleanText(item.name, 70) || "상품",
          unit: cleanText(item.unit, 80),
          price: cleanText(item.price, 50) || "상담 문의",
          badge: cleanText(item.badge, 24),
          style: cleanStyle(item.style),
          visible: item.visible !== false
        }))
      : []
  }));
}

function cleanStyle(value) {
  return ["basic", "recommended", "popular", "paused", "event"].includes(value)
    ? value
    : "basic";
}

function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
