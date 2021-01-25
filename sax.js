const createMethod = (list, name, wrap) => {
  const m = function (...args) {
    list.push([name, this, ...args]);
  };
  m.name = name;
  if (wrap) {
    return function (...args) {
      wrap.apply(this, [m, ...args]);
    };
  } else {
    return m;
  }
};

/**
 * A recorded method call. It is tuple containing
 * ```
 * [
 *    the method name,
 *    the this context when the method was called,
 *    ...any arguments passed to the method
 * ]
 * ```
 *
 * @typedef CallEntry {[string, object, ...any]}
 */

/**
 * Methods names from interface `ContentHandler`.
 *
 * Receive notification of the logical content of a document.
 *
 * This module, both source code and documentation, is in the Public Domain, and comes with NO WARRANTY. See http://www.saxproject.org for further information.
 * This is the main interface that most SAX applications implement: if the application needs to be informed of basic parsing events, it implements this interface and registers an instance with the SAX parser using the setContentHandler method. The parser uses the instance to report basic document-related events like the start and end of elements and character data.
 * The order of events in this interface is very important, and mirrors the order of information in the document itself. For example, all of an element's content (character data, processing instructions, and/or subelements) will appear, in order, between the startElement event and the corresponding endElement event.
 *
 * @see http://sax.sourceforge.net/apidoc/org/xml/sax/ContentHandler.html
 * @enum {string}
 */
const ContentHandlerMethods = {
  characters: "characters",
  endDocument: "endDocument",
  endElement: "endElement",
  endPrefixMapping: "endPrefixMapping",
  ignorableWhitespace: "ignorableWhitespace",
  processingInstruction: "processingInstruction",
  setDocumentLocator: "setDocumentLocator",
  skippedEntity: "skippedEntity",
  startDocument: "startDocument",
  startElement: "startElement",
  startPrefixMapping: "startPrefixMapping",
};

/**
 * SAX2 extension handler for DTD declaration events.
 *
 * This module, both source code and documentation, is in the Public Domain, and comes with NO WARRANTY. See http://www.saxproject.org for further information.
 *
 * This is an optional extension handler for SAX2 to provide more complete information about DTD declarations in an XML document. XML readers are not required to recognize this handler, and it is not part of core-only SAX2 distributions.
 *
 * Note that data-related DTD declarations (unparsed entities and notations) are already reported through the DTDHandler interface.
 *
 * If you are using the declaration handler together with a lexical handler, all of the events will occur between the startDTD and the endDTD events.
 *
 * @see http://www.saxproject.org/apidoc/org/xml/sax/ext/DeclHandler.html
 * @enum {string}
 */
const DeclHandlerMethods = {
  attributeDecl: "attributeDecl",
  elementDecl: "elementDecl",
  externalEntityDecl: "externalEntityDecl",
  internalEntityDecl: "internalEntityDecl",
};

/**
 * Receive notification of basic DTD-related events.
 *
 * This module, both source code and documentation, is in the Public Domain, and comes with NO WARRANTY. See http://www.saxproject.org for further information.
 *
 * If a SAX application needs information about notations and unparsed entities, then the application implements this interface and registers an instance with the SAX parser using the parser's setDTDHandler method. The parser uses the instance to report notation and unparsed entity declarations to the application.
 *
 * Note that this interface includes only those DTD events that the XML recommendation requires processors to report: notation and unparsed entity declarations.
 *
 * The SAX parser may report these events in any order, regardless of the order in which the notations and unparsed entities were declared; however, all DTD events must be reported after the document handler's startDocument event, and before the first startElement event. (If the LexicalHandler is used, these events must also be reported before the endDTD event.)
 *
 * It is up to the application to store the information for future use (perhaps in a hash table or object tree). If the application encounters attributes of type "NOTATION", "ENTITY", or "ENTITIES", it can use the information that it obtained through this interface to find the entity and/or notation corresponding with the attribute value.
 *
 * @see http://www.saxproject.org/apidoc/org/xml/sax/DTDHandler.html
 * @enum {string}
 */
const DTDHandlerMethods = {
  notationDecl: "notationDecl",
  unparsedEntityDecl: "unparsedEntityDecl",
};

/**
 * Basic interface for resolving entities.
 *
 * This module, both source code and documentation, is in the Public Domain, and comes with NO WARRANTY. See http://www.saxproject.org for further information.
 *
 * If a SAX application needs to implement customized handling for external entities, it must implement this interface and register an instance with the SAX driver using the setEntityResolver method.
 *
 * The XML reader will then allow the application to intercept any external entities (including the external DTD subset and external parameter entities, if any) before including them.
 *
 * Many SAX applications will not need to implement this interface, but it will be especially useful for applications that build XML documents from databases or other specialised input sources, or for applications that use URI types other than URLs.
 *
 * The application can also use this interface to redirect system identifiers to local URIs or to look up replacements in a catalog (possibly by using the public identifier).
 *
 * @see http://www.saxproject.org/apidoc/org/xml/sax/EntityResolver.html
 * @enum {string}
 */
const EntityResolverMethods = {
  resolveEntity: "resolveEntity",
};

/**
 * Basic interface for SAX error handlers.
 *
 * This module, both source code and documentation, is in the Public Domain, and comes with NO WARRANTY. See http://www.saxproject.org for further information.
 *
 * If a SAX application needs to implement customized error handling, it must implement this interface and then register an instance with the XML reader using the setErrorHandler method. The parser will then report all errors and warnings through this interface.
 *
 * WARNING: If an application does not register an ErrorHandler, XML parsing errors will go unreported, except that SAXParseExceptions will be thrown for fatal errors. In order to detect validity errors, an ErrorHandler that does something with error() calls must be registered.
 *
 * For XML processing errors, a SAX driver must use this interface in preference to throwing an exception: it is up to the application to decide whether to throw an exception for different types of errors and warnings. Note, however, that there is no requirement that the parser continue to report additional errors after a call to fatalError. In other words, a SAX driver class may throw an exception after reporting any fatalError. Also parsers may throw appropriate exceptions for non-XML errors. For example, XMLReader.parse() would throw an IOException for errors accessing entities or the document.
 *
 * @see http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
 * @enum {string}
 */
const ErrorHandlerMethods = {
  error: "error",
  fatalError: "fatalError",
  warning: "warning",
};

/**
 * SAX2 extension handler for lexical events.
 *
 * This module, both source code and documentation, is in the Public Domain, and comes with NO WARRANTY. See http://www.saxproject.org for further information.
 *
 * This is an optional extension handler for SAX2 to provide lexical information about an XML document, such as comments and CDATA section boundaries. XML readers are not required to recognize this handler, and it is not part of core-only SAX2 distributions.
 *
 * The events in the lexical handler apply to the entire document, not just to the document element, and all lexical handler events must appear between the content handler's startDocument and endDocument events.
 *
 * @see http://www.saxproject.org/apidoc/org/xml/sax/ext/LexicalHandler.html
 * @enum {string}
 */
const LexicalHandlerMethods = {
  comment: "comment",
  endCDATA: "endCDATA",
  endDTD: "endDTD",
  endEntity: "endEntity",
  startCDATA: "startCDATA",
  startDTD: "startDTD",
  startEntity: "startEntity",
};

const getAllMethodNames = () => [
  ...Object.keys(ContentHandlerMethods),
  ...Object.keys(DeclHandlerMethods),
  ...Object.keys(DTDHandlerMethods),
  ...Object.keys(EntityResolverMethods),
  ...Object.keys(ErrorHandlerMethods),
  ...Object.keys(LexicalHandlerMethods),
];
const ALL_METHODS = new Set(getAllMethodNames());

/**
 * @typedef Locator {any}
 * @typedef Attributes {any}
 * @typedef InputSource {any}
 * @typedef SaxParseException {any}
 *
 *
 * @typedef SaxHandler
 * @property {() => CallEntry[]} getCallsInOrder
 * @property {(eName:string, aName:string, type:string, mode:string, value:string) => void} attributeDecl
 * @property {(ch:string, start:number, length:number) => void} characters
 * @property {(ch:string, start:number, length:number) => void} comment
 * @property {(name:string, model:string) => void} elementDecl
 * @property {() => void} endCDATA
 * @property {() => void} endDocument
 * @property {() => void} endDTD
 * @property {(uri:string, localName:string, qName:string) => void} endElement
 * @property {(name:string) => void} endEntity
 * @property {(prefix:string) => void} endPrefixMapping
 * @property {(exception:SaxParseException) => void} error
 * @property {(name:string, publicId:string, systemId:string) => void} externalEntityDecl
 * @property {(exception:SaxParseException) => void} fatalError
 * @property {(ch:string, start:number, length:number) => void} ignorableWhitespace
 * @property {(name:string, value:string) => void} internalEntityDecl
 * @property {(name:string, publicId:string, systemId:string) => void} notationDecl
 * @property {(target:string, data:string) => void} processingInstruction
 * @property {(publicId:string, systemId:string) => InputSource} resolveEntity
 * @property {(locator:Locator) => void} setDocumentLocator
 * @property {(name:string) => void} skippedEntity
 * @property {() => void} startCDATA
 * @property {() => void} startDocument
 * @property {() => void} startDocument
 * @property {(name:string, publicId:string, systemId:string) => void} startDTD
 * @property {(uri:string, localName:string, qName:string, attributes:Attributes) => void} startElement
 * @property {(name:string) => void} startEntity
 * @property {(prefix:string, uri:string) => void} startPrefixMapping
 * @property {(name:string, publicId:string, systemId:string, notationName:string) => void} unparsedEntityDecl
 * @property {(exception:SaxParseException) => void} warning
 */

/**
 * @typedef Methods {ContentHandlerMethods | DeclHandlerMethods | DTDHandlerMethods | EntityResolverMethods | ErrorHandlerMethods | LexicalHandlerMethods}
 * @typedef SaxHandlerOptions
 * @property {Partial<Record<Methods, string>>} alias to make a method available at a custom name
 * @property {Partial<Record<Methods, function(Function, ...any[]): any>>} wrap to wrap a method code with custom handler, passes the method to wrap as frist argument and all arguments after that
 */

/**
 *
 * @param {string} method
 * @param {CallEntry[]} calls
 */
const canOnlyBeCalledOnce = (method, calls) => {
  const called = calls.filter(([name]) => name === it).length;
  if (called > 0) {
    throw new Error(
      `Expected only one call to '${it}', but has been called ${called} times.`
    );
  }
  return called;
};

/**
 *
 * @param {string} method
 * @param {CallEntry[]} calls
 */
const shouldBeCalledOnce = (method, calls) => {
  const called = canOnlyBeCalledOnce(method, calls);
  if (called === 0) {
    throw new Error(
      `Expected at least one call to '${it}', but has not been called.`
    );
  }
  return called;
};

/**
 *
 * @param {string} method
 * @param {CallEntry[]} calls
 * @param {function(CallEntry): boolean} predicate
 */
const shouldBeCalledFirst = (method, calls, predicate) => {
  const firstCall = (predicate ? calls.find(predicate) : calls)[0];
  if (firstCall !== method) {
    throw new Error(
      `Expected '${method}' to be called first, but was '${firstCall}'.`
    );
  }
};

/**
 *
 * @param {string} method
 * @param {CallEntry[]} calls
 * @param {function(CallEntry): boolean} predicate
 */
const shouldBeCalledLast = (method, calls, predicate) => {
  const relevant = predicate ? calls.filter(predicate) : calls;
  const lastCall = relevant[relevant.length - 1][0];
  if (lastCall !== method) {
    throw new Error(
      `Expected '${method}' to be called last, but was '${lastCall}'.`
    );
  }
};

/**
 * @type {Record<Methods, function(CallEntry[]):void>}
 */
const MethodAssertions = {
  /**
   * Can only be called once and before all ContentHandlerMethods.
   */
  [ContentHandlerMethods.setDocumentLocator]: (calls) => {
    const it = ContentHandlerMethods.setDocumentLocator;
    const called = canOnlyBeCalledOnce(it, calls);
    if (called === 0) {
      return;
    }
    shouldBeCalledFirst(it, calls, ([name]) => name in ContentHandlerMethods);
  },
  /**
   * Needs to be called once and between `setDocumentLocator`(optional) and all other ContentHandlerMethods.
   */
  [ContentHandlerMethods.startDocument]: (calls) => {
    const it = ContentHandlerMethods.startDocument;
    shouldBeCalledOnce(it, calls);
    shouldBeCalledFirst(
      it,
      calls,
      ([name]) =>
        name !== ContentHandlerMethods.setDocumentLocator &&
        name in ContentHandlerMethods
    );
  },
  /**
   * There is an apparent contradiction between the documentation for this method and the documentation for ErrorHandler.fatalError(org.xml.sax.SAXParseException). Until this ambiguity is resolved in a future major release, clients should make no assumptions about whether endDocument() will or will not be invoked when the parser has reported a fatalError() or thrown an exception.
   *
   * The SAX parser will invoke this method only once, and it will be the last method invoked during the parse. The parser shall not invoke this method until it has either abandoned parsing (because of an unrecoverable error) or reached the end of input.
   *
   */
  [ContentHandlerMethods.endDocument]: (calls) => {
    const it = ContentHandlerMethods.endDocument;
    const called = canOnlyBeCalledOnce(it, calls);
    if (called === 0) {
      return;
    }
    shouldBeCalledLast(
      it,
      calls,
      ([name]) =>
        name !== ContentHandlerMethods.setDocumentLocator &&
        name in ContentHandlerMethods
    );
  },
};

/**
 * Creates an instance that can be attached to a SAX parser.
 *
 * @param {SaxHandlerOptions} options
 * @returns {SaxHandler}
 */
const handler = ({ alias = {}, wrap = {} } = {}) => {
  const calls = [];
  /**
   * Verify assumptions about method handler calls.
   *
   * @param assertions {typeof MethodAssertions}
   * @see MethodAssertions
   */
  const assertMethodCalls = (assertions = MethodAssertions) => {
    Object.values(assertions).forEach(assertion =>
      assertion(calls)
    );
  };
  /**
   * Returns a list of recorded method calls in the recorded order.
   *
   * @see CallEntry
   */
  const getCallsInOrder = () => calls.map((entry) => [...entry]);

  return {
    assertMethodCalls,
    getCallsInOrder,
    ...getAllMethodNames().reduce((acc, name) => {
      acc[name] = createMethod(calls, name, wrap[name]);
      if (alias[name] && !ALL_METHODS.has(alias[name])) {
        acc[alias[name]] = acc[name];
      }
      return acc;
    }, {}),
  };
};

module.exports = {
  getAllMethodNames,
  ContentHandlerMethods,
  DeclHandlerMethods,
  DTDHandlerMethods,
  EntityResolverMethods,
  ErrorHandlerMethods,
  LexicalHandlerMethods,
  MethodAssertions,
  SaxHandler: handler,
};
