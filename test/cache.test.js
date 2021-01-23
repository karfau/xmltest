const { cache } = require("../cache");

describe("cache", () => {
  test("should have no keys initially", () => {
    expect(cache().keys()).toHaveLength(0);
  });
  test.each(["key", 0, 1, "", null, NaN, undefined])(
    "should store value for key `%s`",
    (key) => {
      const value = {};
      const it = cache();

      expect(it.has(key)).toBe(false);
      it.set(key, value);
      expect(it.has(key)).toBe(true);
      expect(it.keys()).toHaveLength(1);
      expect(it.get(key)).toBe(value);
    }
  );
  test.each(["key", 0, 1, "", null, NaN, undefined])(
    "should return undefined for key `%s`",
    (key) => {
      const it = cache();

      expect(it.has(key)).toBe(false);
      expect(it.get(key)).toBeUndefined();
    }
  );
  test.each(["key", 0, 1, "", null, NaN, undefined])(
    "should delete key for key `%s`",
    (key) => {
      const it = cache();
      it.set(key, {});
      it.delete(key);
      expect(it.has(key)).toBe(false);
      expect(it.get(key)).toBeUndefined();
    }
  );
  test("should clear the cache", () => {
    const it = cache();
    it.set("key", {});
    it.clear();
    expect(it.has("key")).toBe(false);
    expect(it.keys()).toHaveLength(0);
  });
});
