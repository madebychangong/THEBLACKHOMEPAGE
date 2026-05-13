import "./styles.css";
import { readPriceData } from "./encoded-prices.js";

const FALLBACK_DATA = {
  site: {
    brand: "더블랙샵",
    title: "디4 시세표",
    subtitle: "빠르게 확인하고, 필요한 상품은 카톡으로 바로 상담하세요.",
    notice: "저보다 저렴한 곳 있으면 편하게 말씀해주세요.",
    hours: "영업시간: 10:00 - 익일 02:00",
    kakaoOneToOneUrl: "https://open.kakao.com/o/gWbuthWf",
    kakaoGroupUrl: "https://open.kakao.com/o/g8JqBqLg",
    tags: ["대기X출발", "최저가대응", "재고확인", "빠른답변"]
  },
  products: []
};

const app = document.querySelector("#app");
let currentProducts = [];

installCopyGuards();
init();

async function init() {
  const data = await loadPublicData();
  renderStorefront(data);
}

async function loadPublicData() {
  const fallback = readFallbackData();

  try {
    const response = await fetch("/api/prices", {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("prices unavailable");
    return mergeData(await response.json());
  } catch {
    return fallback;
  }
}

function readFallbackData() {
  try {
    return mergeData(readPriceData());
  } catch {
    return mergeData(FALLBACK_DATA);
  }
}

function mergeData(data) {
  return {
    site: { ...FALLBACK_DATA.site, ...(data?.site || {}) },
    products: Array.isArray(data?.products)
      ? data.products.map((product) => ({
          icon: product.icon ?? "",
          name: product.name ?? "",
          description: product.description ?? "",
          badge: product.badge ?? "",
          visible: product.visible !== false,
          rows: Array.isArray(product.rows)
            ? product.rows.map((row) => ({
                label: row.label ?? "",
                price: row.price ?? ""
              }))
            : []
        }))
      : [],
    updatedAt: data?.updatedAt || ""
  };
}

function installCopyGuards() {
  const guardedSelector = ".hero, .board-meta, .notice, .price-shell, .hours";
  const inputSelector = "input, textarea, [contenteditable='true']";
  const getElement = (target) => (target instanceof Element ? target : target?.parentElement);

  document.addEventListener("copy", (event) => {
    const target = getElement(event.target);
    if (!target?.closest(guardedSelector) || target.closest(inputSelector)) return;
    event.preventDefault();
    event.clipboardData?.setData("text/plain", "");
  });

  document.addEventListener("contextmenu", (event) => {
    const target = getElement(event.target);
    if (!target?.closest(guardedSelector) || target.closest(inputSelector)) return;
    event.preventDefault();
  });

  document.addEventListener("dragstart", (event) => {
    const target = getElement(event.target);
    if (target?.closest(guardedSelector)) event.preventDefault();
  });
}

function renderStorefront(data) {
  currentProducts = data.products.filter((product) => product.visible !== false);
  app.innerHTML = storefrontHtml(data);

  const search = document.querySelector("#search");
  const cards = document.querySelector("#cards");
  const empty = document.querySelector("#empty");

  renderCards(cards, empty, currentProducts);
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    const filtered = currentProducts.filter((product) =>
      [product.name, product.description, product.badge, ...product.rows.flatMap((row) => [row.label, row.price])]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
    renderCards(cards, empty, filtered);
  });
}

function storefrontHtml(data) {
  const today = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(new Date());
  const updatedAt = data.updatedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(data.updatedAt))
    : new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date());
  const talking = buildTalkingCount();

  return `
    <main class="page">
      <section class="hero">
        <div class="brand-row">
          <div class="brand">
            <img src="/logo.png" alt="" />
            <div>
              <strong>${escapeHtml(data.site.brand)}</strong>
              <span>${escapeHtml(data.site.title)}</span>
            </div>
          </div>
          <div class="live-pill">
            <span>현재 상담중</span>
            <strong class="pulse">${talking}명</strong>
          </div>
        </div>
        <div class="trust-grid">
          ${data.site.tags
            .slice(0, 4)
            .map(
              (tag, index) => `
                <span class="trust-item trust-${index + 1}">
                  <i aria-hidden="true"></i>
                  <em>${escapeHtml(tag)}</em>
                </span>
              `
            )
            .join("")}
        </div>
      </section>

      <section class="board-meta">
        <div>
          <span class="date-label">TODAY PRICE</span>
          <h2>${today} 시세표</h2>
        </div>
        <span class="update-chip">최근 반영 ${updatedAt}</span>
      </section>

      <section class="notice">
        <span>공지</span>
        <p>${escapeHtml(data.site.notice)}</p>
      </section>

      <section class="price-shell">
        <div class="tools">
          <input class="search" id="search" type="search" placeholder="상품 검색" aria-label="상품 검색" />
        </div>
        <div class="cards" id="cards"></div>
        <div class="empty" id="empty">검색 결과가 없습니다.</div>
      </section>

      <p class="hours">${escapeHtml(data.site.hours)}</p>

      <div class="sticky-actions">
        <a href="${escapeAttribute(data.site.kakaoOneToOneUrl)}" target="_blank" rel="noopener noreferrer">1:1 톡</a>
        <a href="${escapeAttribute(data.site.kakaoGroupUrl)}" target="_blank" rel="noopener noreferrer">단톡방</a>
      </div>
    </main>
  `;
}

function renderCards(cards, empty, products) {
  cards.innerHTML = products
    .map(
      (product) => `
        <article class="card">
          <div class="card-head">
            <div>
              <h3>${escapeHtml(product.icon || "")} ${escapeHtml(product.name)}</h3>
              <p>${escapeHtml(product.description || "")}</p>
            </div>
            ${product.badge ? `<span class="badge">${escapeHtml(product.badge)}</span>` : ""}
          </div>
          <div class="rows">
            ${product.rows
              .map(
                (row) => `
                  <div class="price-row">
                    <span>${escapeHtml(row.label)}</span>
                    <b>${escapeHtml(row.price)}</b>
                  </div>
                `
              )
              .join("")}
          </div>
        </article>
      `
    )
    .join("");
  empty.classList.toggle("visible", products.length === 0);
}

function buildTalkingCount() {
  const now = new Date();
  return 3 + ((now.getHours() * 7 + now.getMinutes()) % 6);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
