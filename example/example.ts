import fetch from "cross-fetch";
import { caches } from "../lib";

// Set options for any cache that is opened
caches.setOptions({
  // Optionally provide an alternative fetch function
  fetch: fetch,
  // Optionally provide a settings for the LRU cache. Options are defined here:
  // https://www.npmjs.com/package/lru-cache
  lruOptions: {
    max: 1000,
  },
});

async function run() {
  const cache = await caches.open("v1");
  // Make a request
  // Logs "response1: 425.793ms"
  console.time("response1");
  const _response1 = await cache.match(
    "https://httpbin.org/response-headers?cache-control=max-age%3D604800"
  );
  console.timeEnd("response1");
  // Make a request to the same location
  // Logs "response2: 1.74ms" because the response was cached
  console.time("response2");
  const _response2 = await cache.match(
    "https://httpbin.org/response-headers?cache-control=max-age%3D604800"
  );
  console.timeEnd("response2");
}
run();
