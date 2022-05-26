/**
 * Tests copied and modified from https://github.com/jimmywarting/cache-polyfill/tree/master/test
 */
import { Cache, caches } from "../lib/index";

describe("caches", () => {
  beforeEach(() => caches.delete("v1"));

  describe("CacheStorage", () => {
    beforeEach(() => caches.delete("v1"));

    it("CacheStorage.open should return a Cache.", async () => {
      const cache = await caches.open("v1");
      console.assert(cache instanceof Cache);
    });

    // We might not follow this...
    // Browser can still add items to a cache storage even when it's deleted
    // (this tells me that the cache is deleted upon garbage collection)
    //
    // If we would support this it would have to switch to a memory cache state
    it.skip("CacheStorage.delete dooms", async () => {
      const cache_name = "v1";

      await caches.delete(cache_name);
      const first_cache = await caches.open(cache_name);
      await caches.delete(cache_name);
      // This shouldn't add items to the cache...
      await first_cache.add("https://httpbin.org/get");
      const cache_names = await caches.keys();
      console.assert(cache_names.indexOf(cache_name) === -1);
      const second_cache = await caches.open(cache_name);
      let keys = await second_cache.keys();
      console.assert(keys.length === 0);
      keys = await first_cache.keys();
      console.assert(keys.length === 1);
      // Clean up
      await caches.delete(cache_name);
    });

    it("CacheStorage.open should accept an empty name.", async () => {
      await caches.delete("");
      const cache = await caches.open("");
      console.assert(cache instanceof Cache);
    });

    it("CacheStorage.open should throw TypeError if called with no arguments.", async () => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const cache = await caches.open().catch((a) => a);
      console.assert(cache instanceof TypeError);
    });

    it("CacheStorage.has with existing cache", async () => {
      const test_cases = [
        {
          name: "cache-storage/lowercase",
          should_not_match: [
            "cache-storage/Lowercase",
            " cache-storage/lowercase",
            "cache-storage/lowercase ",
          ],
        },
        {
          name: "cache-storage/has a space",
          should_not_match: ["cache-storage/has"],
        },
        {
          name: "cache-storage/has\000_in_the_name",
          should_not_match: [
            "cache-storage/has",
            "cache-storage/has_in_the_name",
          ],
        },
      ];

      for (const testcase of test_cases) {
        const cache_name = testcase.name;
        await caches.delete(cache_name);
        await caches.open(cache_name);
        const result = await caches.has(cache_name);

        console.assert(
          result === true,
          "CacheStorage.has should return true for existing cache."
        );

        for (const cache_name of testcase.should_not_match) {
          const result = await caches.has(cache_name);
          console.assert(
            !result,
            "CacheStorage.has should only perform exact matches on cache names."
          );
        }

        await caches.delete(cache_name);
      }
    });

    it("CacheStorage.has with nonexistent cache", async () => {
      const cache_exists = await caches.has("cheezburger");
      console.assert(
        cache_exists === false,
        "CacheStorage.has should return false for nonexistent cache."
      );
    });

    it("CacheStorage.open with existing cache", async () => {
      const cache_name = "cache-storage/open";
      await caches.delete(cache_name);
      const cache = await caches.open(cache_name);
      await cache.add("https://httpbin.org/get");
      const result = await caches.open(cache_name);

      console.assert(
        result instanceof Cache,
        "CacheStorage.open should return a Cache object"
      );
      console.assert(
        result != cache,
        "CacheStorage.open should return a new Cache object each time its called."
      );

      const results = await Promise.all([cache.keys(), result.keys()]);
      const expected_urls = results[0].map((r) => r.url);
      const actual_urls = results[1].map((r) => r.url);
      const equal = actual_urls + "" === expected_urls + "";

      console.assert(
        equal,
        "CacheStorage.open should return a new Cache object for the same backing store."
      );
    });

    it("CacheStorage.delete with existing cache", async () => {
      const cache_name = "cache-storage/delete";

      await caches.delete(cache_name);
      await caches.open(cache_name);
      const result = await caches.delete(cache_name);
      console.assert(
        result,
        "CacheStorage.delete should return true after deleting an existing cache."
      );
      const cache_exists = await caches.has(cache_name);
      console.log(cache_exists);
      console.assert(
        cache_exists === false,
        "CacheStorage.has should return false after fulfillment of CacheStorage.delete promise."
      );
    });

    it("CacheStorage.delete with nonexistent cache", async () => {
      const result = await caches.delete("cheezburger");
      console.assert(
        result === false,
        "CacheStorage.delete should return false for a nonexistent cache."
      );
    });
  });
});
