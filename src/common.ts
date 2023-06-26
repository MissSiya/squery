import {DateType} from "./types";

export function toUnixTime(date: DateType) {
  return new Date(date).getTime();
}