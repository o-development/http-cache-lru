import { requestMatchesCachedItem } from "./requestMatchesCachedItem";
import { RequestResponseList } from "./requestResponseList";

export default function queryCache(
  requestQuery: Request,
  options?: CacheQueryOptions,
  targetStorage?: RequestResponseList
): RequestResponseList {
  const resultList: RequestResponseList = [];
  // TODO: set the relatant request response list
  const storage = targetStorage ? targetStorage : [];
  storage.forEach((requestResponse) => {
    const cachedRequest = requestResponse.request;
    const cachedResponse = requestResponse.response;
    if (
      requestMatchesCachedItem(
        requestQuery,
        cachedRequest,
        cachedResponse,
        options
      )
    ) {
      const requestCopy = cachedRequest.clone();
      const responseCopy = cachedResponse.clone();
      resultList.push({ request: requestCopy, response: responseCopy });
    }
  });
  return resultList;
}
