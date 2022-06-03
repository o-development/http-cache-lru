import { CacheLru } from "../lib/CacheLru";
import { CacheStorageLru } from "../lib/CacheStorageLru";
import { Request } from "cross-fetch";

describe("CacheStorageLru", () => {
  let cacheStorage: CacheStorageLru;

  beforeEach(() => {
    cacheStorage = new CacheStorageLru();
  });

  it("Opens a cache", async () => {
    const cache1 = await cacheStorage.open("1");
    const cache2 = await cacheStorage.open("2");
    expect(cache1).toBeInstanceOf(CacheLru);
    expect(cache2).toBeInstanceOf(CacheLru);
    expect(cache2).not.toBe(cache1);
  });

  it("It Opens the same cache", async () => {
    const cache1 = await cacheStorage.open("1");
    const cache2 = await cacheStorage.open("1");
    expect(cache2).toBe(cache1);
  });

  it("Deletes a cache", async () => {
    await cacheStorage.open("1");
    expect(await cacheStorage.has("1")).toBe(true);
    await cacheStorage.delete("1");
    expect(await cacheStorage.has("1")).toBe(false);
  });

  it("Returns the correct keys", async () => {
    await cacheStorage.open("1");
    await cacheStorage.open("2");
    await cacheStorage.open("3");
    expect(await cacheStorage.keys()).toEqual(["1", "2", "3"]);
  });

  it("Match throws ", async () => {
    await expect(
      cacheStorage.match(new Request("https://example.com"))
    ).rejects.toThrow("Not Implemented");
  });
});
