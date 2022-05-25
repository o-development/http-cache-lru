export class CacheLru implements Cache {
  add(request: RequestInfo): Promise<void> {
    throw new Error("Method not implemented.");
  }
  addAll(requests: RequestInfo[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  delete(request: RequestInfo, options?: CacheQueryOptions): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  keys(
    request?: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<readonly Request[]> {
    throw new Error("Method not implemented.");
  }
  match(
    request: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<Response | undefined> {
    throw new Error("Method not implemented.");
  }
  matchAll(
    request?: RequestInfo,
    options?: CacheQueryOptions
  ): Promise<readonly Response[]> {
    throw new Error("Method not implemented.");
  }
  put(request: RequestInfo, response: Response): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
