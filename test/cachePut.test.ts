/**
 * Tests copied and modified from https://github.com/jimmywarting/cache-polyfill/tree/master/test
 */
import { caches } from "../lib";
import { Request, Response, fetch } from "cross-fetch";

const test_url = "https://example.com/foo";
const test_body = (body = "Hello world!") => body;

describe("cache-put", () => {
  beforeEach(() => caches.delete("v1"));

  it("Cache.put called with simple Request and Response", async () => {
    const request = new Request(test_url);
    const response = new Response(test_body());
    const cache = await caches.open("v1");
    const result = await cache.put(request, response);
    expect(result).toBeUndefined();
  });

  it("Cache.put called with Request and Response from fetch()", async () => {
    const cache = await caches.open("v1");
    const test_url =
      "https://httpbin.org/response-headers?cache-control=max-age%3D604800&echo=foo";
    const request = new Request(test_url);
    const fetch_result = await fetch(request);
    const response = fetch_result.clone();
    await cache.put(request, fetch_result);
    const match = (await cache.match(test_url)) as Response;
    const bodies = await Promise.all([match.text(), response.text()]);
    expect(bodies[0]).toBe(bodies[1]);
  });

  it("Cache.put with Request without a body", async () => {
    const cache = await caches.open("v1");
    const request = new Request(test_url);
    const response = new Response(test_body());
    expect(request.bodyUsed).toBe(false);
    await cache.put(request, response);
    expect(request.bodyUsed).toBe(false);
  });

  it("Cache.put with an empty response body", async () => {
    const cache = await caches.open("v1");
    const request = new Request(test_url);
    const response = new Response("hej", {
      status: 200,
      headers: [
        ["Content-Type", "text/plain"],
        ["cache-control", "max-age=604800"],
      ],
    });
    await cache.put(request, response);
    const result = (await cache.match(test_url)) as Response;
    const body = await result.text();
    expect(result.status).toBe(200);
    expect(result.headers.get("Content-Type")).toBe("text/plain");
    expect(body).toBe("hej");
  });

  it("Cache.put with HTTP 500 response", async () => {
    const cache = await caches.open("v1");
    const test_url = "https://httpbin.org/status/500";
    const request = new Request(test_url);
    const fetch_result = await fetch(test_url);
    expect(fetch_result.status).toBe(500);
    // const response = fetch_result.clone();
    await cache.put(request, fetch_result);
    const result = (await cache.match(test_url)) as Response;
    expect(result.status).toBe(500);
    const body = await result.text();
    expect(body).toBe("");
  });

  it("Cache.put with HTTP 206 response", async () => {
    const cache = await caches.open("v1");
    const request = new Request("https://httpbin.org/status/206");
    const response = new Response("part...", { status: 206 });
    const err = await cache.put(request, response).catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put called twice with matching Requests and different Responses", async () => {
    const cache = await caches.open("v1");
    const alternate_response_body = "New body";
    const alternate_response = new Response(alternate_response_body, {
      statusText: "New status",
    });
    await cache.put(
      new Request(test_url),
      new Response("Old body", { statusText: "Old status" })
    );
    await cache.put(new Request(test_url), alternate_response.clone());
    const result = (await cache.match(test_url)) as Response;
    const body = await result.text();
    expect(body).toBe(alternate_response_body);
  });

  it("Cache.put called twice with request URLs that differ only by a fragment", async () => {
    const cache = await caches.open("v1");
    const test_url = "https://example.com/foo";
    const first_url = test_url;
    const second_url = first_url + "#(O_o)";
    const alternate_response_body = "New body";
    const alternate_response = new Response(
      test_body(alternate_response_body),
      {
        statusText: "New status",
      }
    );

    await cache.put(
      new Request(first_url),
      new Response(test_body("Old body"), { statusText: "Old status" })
    );
    await cache.put(new Request(second_url), alternate_response.clone());
    const result = (await cache.match(test_url)) as Response;
    const body = await result.text();
    expect(body).toBe("New Body");
  });

  it("Cache.put with a string request", async () => {
    const cache = await caches.open("v1");
    const url = "http://example.com/foo";
    await cache.put(url, new Response(test_body("some body")));
    const response = (await cache.match(url)) as Response;
    const body = await response.text();
    expect(body).toBe("some body");
  });

  it("Cache.put with an invalid response", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .put(new Request(test_url), new Response("Hello world!"))
      .catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put with a non-HTTP/HTTPS request", async () => {
    const cache = await caches.open("v1");
    const err = await cache
      .put(new Request("file:///etc/passwd"), new Response(test_body()))
      .catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put with a non-GET request", async () => {
    const cache = await caches.open("v1");
    const request = new Request("http://example.com/foo", { method: "HEAD" });
    const err = await cache
      .put(request, new Response(test_body()))
      .catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put with a null response", async () => {
    const cache = await caches.open("v1");
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const err = await cache.put(new Request(test_url), null).catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put with a POST request", async () => {
    const cache = await caches.open("v1");
    const request = new Request(test_url, {
      method: "POST",
      body: test_body(),
    });
    const err = await cache
      .put(request, new Response(test_body()))
      .catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put with a used response body", async () => {
    const cache = await caches.open("v1");
    const response = new Response(test_body());
    expect(response.bodyUsed).toBe(false);
    await response.text();
    expect(response.bodyUsed).toBe(false);
    const request = new Request(test_url);
    const err = await cache.put(request, response).catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put with a VARY:* Response", async () => {
    const cache = await caches.open("v1");
    const req = new Request(test_url);
    const res = new Response(test_body(), { headers: { VARY: "*" } });
    const err = await cache.put(req, res).catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });

  it("Cache.put with an embedded VARY:* Response", async () => {
    const cache = await caches.open("v1");
    const req = new Request(test_url);
    const res = new Response(test_body(), {
      headers: { VARY: "Accept-Language,*" },
    });
    const err = await cache.put(req, res).catch((a) => a);
    expect(err).toBeInstanceOf(TypeError);
  });
});
