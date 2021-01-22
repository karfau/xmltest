const entries = require("../xmltest.json");
const { run, contentLoader } = require("../xmltest.js");
const path = require("path");

const README_PATH = "xmltest/readme.html";
const TEST_ZIP_PATH = path.join(__dirname, "..", "test.zip");

const TEST_ZIP_ENTRIES = {
  "folder/": "",
  "folder/file.ext": "file.ext",
  "folder/empty": "empty",
};

describe("run", () => {
  beforeEach(() => {
    contentLoader.DATA = null;
  });
  describe("only filter arguments", () => {
    test("should return entries without any arguments", async () => {
      // FYI: xmltest.zip doesn't contain any folder entries
      expect(await run()).toEqual(entries);
    });
    test("should return all (file) keys in entries with first argument 'xmltest'", async () => {
      expect(Object.keys(await run("xmltest"))).toEqual(Object.keys(entries));
    });
    test("should return the content of readme.html with first argument 'xmltest/readme.html'", async () => {
      expect(await run(README_PATH)).toMatch(/^<HTML>.*/);
    });
    test("should return dict with single key when multiple filters only match one entry", async () => {
      const actual = await run(...README_PATH.split("/"));
      expect(Object.keys(actual)).toHaveLength(1);
      expect(actual[README_PATH]).toMatch(/^<HTML>.*/);
    });
  });
  describe("first argument is path to zip", () => {
    test.each(["./test.zip", "../xmltest/test.zip", TEST_ZIP_PATH])(
      "should return all entries without any filter arguments %s",
      async (pathToZip) => {
        expect(await run(pathToZip)).toEqual(TEST_ZIP_ENTRIES);
      }
    );
    test("should return all file keys in entries with first filter argument 'folder'", async () => {
      const actual = await run(TEST_ZIP_PATH, "folder");
      expect(Object.keys(actual)).toEqual(
        Object.keys(TEST_ZIP_ENTRIES).filter((entry) => !entry.endsWith("/"))
      );
    });
    test("should return the content when first filter argument matches a file", async () => {
      expect(await run(TEST_ZIP_PATH, "folder/file.ext")).toBe("CONTENT\n");
      expect(await run(TEST_ZIP_PATH, "folder/empty")).toBe("");
    });
    test("should return dict with single key when multiple filters only match one entry", async () => {
      const actual = await run(TEST_ZIP_PATH, "folder", "file");
      expect(Object.keys(actual)).toHaveLength(1);
      expect(actual["folder/file.ext"]).toMatch("CONTENT\n");
    });
  });
});
