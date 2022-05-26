import { Options } from "lru-cache";
import PolicyResponse from "./PolicyResponse";

const defaultLruOptions: Options<string, PolicyResponse> = {
  max: 100,
};

export default defaultLruOptions;
