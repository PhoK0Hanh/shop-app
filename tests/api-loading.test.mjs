// Kiểm tra response tới sai thứ tự, retry và giỏ dùng catalog API mà không gọi dịch vụ thật.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

function load(file, mocks) {
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  new Function("require", "exports", code)((name) => mocks[name], exports);
  return exports;
}

test("changing query hides old data and late responses cannot replace the current result", async () => {
  const states = [];
  const requests = [];
  let cursor = 0;
  let cleanup;
  let previousDeps;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = initial;
      return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useEffect(callback, deps) {
      if (!previousDeps || deps.some((value, index) => value !== previousDeps[index])) {
        cleanup?.(); cleanup = callback(); previousDeps = deps;
      }
    },
  };
  const { useApi } = load("lib/use-api.ts", {
    react,
    "@/lib/api": {
      apiErrorMessage: () => "failed",
      api: { get: (url, { signal }) => new Promise((resolve, reject) => requests.push({ url, signal, resolve, reject })) },
    },
  });
  const Render = (url) => { cursor = 0; return useApi(url); };
  assert.equal(Render("/products?page=1").loading, true);
  Render("/products?page=2");
  assert.equal(requests[0].signal.aborted, true);
  requests[1].resolve({ data: { page: 2 } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(Render("/products?page=2").data.page, 2);
  requests[0].resolve({ data: { page: 1 } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(Render("/products?page=2").data.page, 2);
  const next = Render("/products?page=3");
  assert.equal(next.data, undefined);
  requests[2].reject(new Error("server error"));
  await new Promise((resolve) => setImmediate(resolve));
  const failed = Render("/products?page=3");
  assert.equal(failed.error, "failed");
  failed.retry();
  assert.equal(Render("/products?page=3").loading, true);
  requests[3].resolve({ data: { page: 3 } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(Render("/products?page=3").data.page, 3);
  cleanup();
});

test("cart recognizes database-only variants and clamps merged quantities to API stock", () => {
  const { normalizeCart, readCart, findCartVariant } = load("lib/cart.ts", {});
  const products = [{ id: "database-only", variants: [{ id: "database-variant", stock: 3 }] }];
  assert.equal(findCartVariant("database-variant", products).product.id, "database-only");
  assert.deepEqual(normalizeCart([
    { variantId: "database-variant", quantity: 2 },
    { variantId: "database-variant", quantity: 2 },
    { variantId: "missing", quantity: 1 },
  ], products), [{ variantId: "database-variant", quantity: 3 }]);
  assert.deepEqual(readCart("invalid-json", products), []);
  assert.deepEqual(normalizeCart([{ variantId: "database-variant", quantity: 1 }], [
    { id: "database-only", variants: [{ id: "database-variant", stock: 0 }] },
  ]), []);
});
