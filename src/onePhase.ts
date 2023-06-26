import {Filter, Message} from "./types";
import {toUnixTime} from "./common";


export function evaluate(msg: Message, query: Filter): boolean {

  if(query.type === "or") {
    for(const filter of query.filters) if(evaluate(msg, filter)) return true;
    return !query.filters.length;
  }

  if(query.type === "and") {
    return query.filters.map(filter => evaluate(msg, filter)).reduce((p, c) => p && c, true);
  }

  const element = msg[query.field];

  switch(query.type) {
    case "string": {
      if(typeof element !== "string") return false;
      const {operation, value} = query;
      const ops: Record<typeof operation, () => boolean> = {
        endsWith: () => element.endsWith(value),
        eq: () => element === value,
        startsWith: () => element.startsWith(value),
        contains: () => element.includes(value)
      };
      return ops[operation]();
    }
    case "boolean": {
      if(typeof element !== "boolean") return false;
      const {operation, value} = query;
      const ops: Record<typeof operation, () => boolean> = {
        eq: () => element === value,
      };
      return ops[operation]();
    }
    case "number": {
      if(typeof element !== "number") return false;
      const {operation, value} = query;
      const ops: Record<typeof operation, () => boolean> = {
        eq: () => element === value,
        gte: () => element >= value,
        lte: () => element <= value,
        lt: () => element < value,
        gt: () => element > value
      };
      return ops[operation]();
    }
    case "date": {
      if(!(typeof element === "string" || element instanceof Date)) return false;
      const {operation, value} = query;
      const ops: Record<typeof operation, () => boolean> = {
        eq: () => element === value,
        after: () => toUnixTime(element) > toUnixTime(value),
        before: () => toUnixTime(element) < toUnixTime(value),
      };
      return ops[operation]();
    }
  }
}