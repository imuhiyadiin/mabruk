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

// Fetch transparently decompresses upstream responses, so do not forward a
// content-encoding header that would make the browser try to decompress again.
const responseHeadersToOmit = new Set([...hopByHopHeaders, "content-encoding"]);

async function proxyApiRequest(request: NextRequest) {
  const backendUrl =
    process.env.SERVER_URL ??
    (process.env.NODE_ENV === "development"
      ? "http://localhost:8001"
      : process.env.NEXT_PUBLIC_API_URL ?? "https://mabruk-1.vercel.app/api");

  const upstreamUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, backendUrl);
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!hopByHopHeaders.has(key.toLowerCase())) headers.set(key, value);
  });
  // The server-to-server fetch can transparently decompress upstream data.
  // Ask the backend for an identity response to avoid forwarding stale gzip metadata.
  headers.set("accept-encoding", "identity");

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return Response.json({ message: "Backend API lama heli karo. Hubi in server-ku socdo." }, { status: 502 });
  }

  const responseHeaders = new Headers();
  upstreamResponse.headers.forEach((value, key) => {
    if (!responseHeadersToOmit.has(key.toLowerCase())) responseHeaders.set(key, value);
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
