import { isAdminHost } from "./_shared/hosts.js";

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const adminHost = isAdminHost(request, env);

  if (adminHost && url.pathname === "/") {
    return Response.redirect(`${url.origin}/admin`, 302);
  }

  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    return adminHost ? next() : notFound();
  }

  if (isAdminApiRequest(url, request.method) && !adminHost) {
    return notFound();
  }

  return next();
}

function isAdminApiRequest(url, method) {
  if (url.pathname === "/api/login") return true;
  if (url.pathname === "/api/logout") return true;
  if (url.pathname === "/api/session") return true;
  if (url.pathname === "/api/catalog" && method !== "GET") return true;
  if (url.pathname === "/api/catalog" && url.searchParams.get("admin") === "1") return true;
  return false;
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
