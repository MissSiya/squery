import {BooleanFilter, DateFilter, DateType, Filter, Message, NumberFilter, StringFilter} from "./types";
import {toUnixTime} from "./common";
import assert from "assert";


const stringOperations: Record<StringFilter["operation"], (self: string, value: string) => boolean> = {
  endsWith: (self, value) => self.endsWith(value),
  contains: (self, value) => self.includes(value),
  startsWith: (self, value) => self.startsWith(value),
  eq: (self, value) => self === value
};

const numberOperations: Record<NumberFilter["operation"], (self: number, value: number) => boolean> = {
  eq: (self, value) => self === value,
  gte: (self, value) => self >= value,
  lte: (self, value) => self <= value,
  lt: (self, value) => self < value,
  gt: (self, value) => self > value
};

const booleanOperations: Record<BooleanFilter["operation"], (self: boolean, value: boolean) => boolean> = {
  eq: (self, value) => self === value
};

const dateOperations: Record<DateFilter["operation"], (self: DateType, value: DateType) => boolean> = {
  eq: (self, value) => toUnixTime(self) === toUnixTime(value),
  after: (self, value) => toUnixTime(self) > toUnixTime(value),
  before: (self, value) => toUnixTime(self) < toUnixTime(value)
};

export function compile(query: Filter): (msg: Message) => boolean {

  if(query.type === "and") {
    const filters = query.filters.map(compile);
    return msg => filters.map(filter => filter(msg)).reduce((p, c) => p && c, true);
  }

  if(query.type === "or") {
    const filters = query.filters.map(compile);
    return msg => {
      for(const filter of filters) if(filter(msg)) return true;
      return !filters.length;
    };
  }

  if(query.type === "string") {
    const {operation, field, value} = query;
    const op = stringOperations[operation] ?? assert.fail();
    return (msg: Message) => {
      const element = msg[field];
      if(typeof element !== "string") return false;
      return op(element, value);
    }
  }

  if(query.type === "date") {
    const {operation, field, value} = query;
    const op = dateOperations[operation];
    return (msg: Message) => {
      const element = msg[field];
      if(!(typeof element === "string" || element instanceof Date)) return false;
      return op(element, value);
    }
  }

  if(query.type === "number") {
    const {operation, field, value} = query;
    const op = numberOperations[operation];
    return (msg: Message) => {
      const element = msg[field];
      if(typeof element !== "number") return false;
      return op(element, value);
    }
  }

  if(query.type === "boolean") {
    const {operation, field, value} = query;
    const op = booleanOperations[operation];
    return (msg: Message) => {
      const element = msg[field];
      if(typeof element !== "boolean") return false;
      return op(element, value);
    }
  }

  assert.fail();
}