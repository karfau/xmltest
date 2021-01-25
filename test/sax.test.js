const { SaxHandler, getAllMethodNames, ContentHandlerMethods } = require("../sax");

describe("sax", () => {
  describe("getCallsInOrder", () => {
    test("should return empty list when nothing was called", () => {
      expect(SaxHandler().getCallsInOrder()).toEqual([]);
    });
    test("should not allow external modifications on top level", () => {
      const it = SaxHandler();
      const callsInOrder = it.getCallsInOrder();
      callsInOrder.push("stuff");
      expect(it.getCallsInOrder()).toEqual([]);
    });
    test("should not allow external modifications on second level", () => {
      const it = SaxHandler();
      it.fatalError();
      it.getCallsInOrder()[0].push("stuff");
      expect(it.getCallsInOrder()[0]).toHaveLength(1);
    });
  });
  describe.each(getAllMethodNames())("%s", (method) => {
    test("should be recorded without arguments", () => {
      const it = SaxHandler();

      it[method]();

      expect(it.getCallsInOrder()).toEqual([[method]]);
    });
    test("should be recorded with arguments", () => {
      const it = SaxHandler();

      it[method](undefined, null, "one", 2, false);

      expect(it.getCallsInOrder()).toEqual([
        [method, undefined, null, "one", 2, false],
      ]);

      it[method]();

      expect(it.getCallsInOrder()).toEqual([
        [method, undefined, null, "one", 2, false],
        [method],
      ]);
    });
    test("should provide alias from options", () => {
      const it = SaxHandler({ alias: { [method]: "customName" } });

      expect(it.customName).toBe(it[method]);
    });
    test("should prevent alias from overriding methods", () => {
      const conflictingName = method === ContentHandlerMethods.startDocument
        ? ContentHandlerMethods.endDocument
        : ContentHandlerMethods.startDocument;
      const it = SaxHandler({
        alias: {
          [method]: conflictingName,
        },
      });

      expect(it[conflictingName]).not.toBe(it[method]);
    });
    test("should wrap function call preserving this", () => {
      const wrapper = jest.fn(function (handler, ...args) {
        handler.apply(this, args);
      });
      const it = SaxHandler({wrap:{[method]:wrapper}});

      it[method](false, '', 0);

      expect(wrapper).toHaveBeenCalledWith(expect.any(Function), false, '', 0);
      expect(it.getCallsInOrder()).toEqual([
        [method, false, '', 0]
      ])
    });
  });
});
