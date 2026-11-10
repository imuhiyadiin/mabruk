import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

async function proxyApiRequest(request: NextRequest) {
  const backendUrl =
    process.env.SERVER_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:8000" : undefined);

  if (!backendUrl) {
    return Response.json({ message: "The API service is not configured." }, { status: 503 });
  }

  const upstreamUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, backendUrl);
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) headers.set(key, value);
  });

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) responseHeaders.set(key, value);
  });

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxyApiRequest;
export const HEAD = proxyApiRequest;
export const POST = proxyApiRequest;
export const PUT = proxyApiRequest;
export const PATCH = proxyApiRequest;
export const DELETE = proxyApiRequest;
export const OPTIONS = proxyApiRequest;
