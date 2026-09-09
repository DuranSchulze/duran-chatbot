import { test } from "node:test";
import assert from "node:assert/strict";
import { citeGroundedAnswer } from "./grounding.ts";

test("links the supported phrase without breaking Unicode offsets", () => {
  const answer = "⚖️ Legal basis. The statute applies.";
  const result = citeGroundedAnswer(answer, {
    groundingChunks: [{ web: { uri: "https://example.gov/law", title: "Statute" } }],
    groundingSupports: [{
      segment: { text: "The statute applies.", endIndex: 999 },
      groundingChunkIndices: [0, 0, 9],
    }],
  });
  assert.match(result.text, /The statute applies\. \[1\]\(<https:\/\/example.gov\/law>\)/);
  assert.equal(result.sourceCount, 1);
  assert.match(result.text, /### Sources/);
  assert.doesNotMatch(result.answerText, /### Sources/);
  assert.match(result.answerText, /\[1\]/);
  assert.deepEqual(result.sources, [{ number: 1, title: "Statute", url: "https://example.gov/law" }]);
});

test("never invents support for missing, ambiguous or unsafe sources", () => {
  assert.equal(citeGroundedAnswer("Hello").text, "Hello");
  const result = citeGroundedAnswer("Same. Same.", {
    groundingChunks: [{ web: { uri: "javascript:alert(1)" } }],
    groundingSupports: [{ segment: { text: "Same." }, groundingChunkIndices: [0] }],
  });
  assert.equal(result.sourceCount, 0);
  assert.deepEqual(result.sources, []);
  assert.equal(result.text, "Same. Same.");
});
