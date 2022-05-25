export class CacheStorageLru implements CacheStorage {
  delete(cacheName: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  has(cacheName: string): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  keys(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
  match(
    request: RequestInfo,
    options?: MultiCacheQueryOptions
  ): Promise<Response | undefined> {
    throw new Error("Method not implemented.");
  }
  open(cacheName: string): Promise<Cache> {
    throw new Error("Method not implemented.");
  }
}
