import {compile} from "./twoPhase";
import {Filter, Message} from "./types";
import {evaluate} from "./onePhase";
import assert from "assert";


export function filterMessages(messages: Message[], query: Filter) {
  const pred = compile(query);

  const predAndCompare = (msg: Message) => {
    const a = pred(msg);
    const b = evaluate(msg, query);
    assert.equal(a, b);
    return a;
  }

  return messages.filter(predAndCompare);
}