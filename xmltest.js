const getStream = require('get-stream')
const path = require('path')
const {promisify} = require('util')
const yauzl = require('yauzl')

const {cache} = require('./cache')
// for type definitions
const {Entry} = require('yauzl')

/**
 * @typedef Entries {Record<string, string | undefined>}
 * @typedef PromiseResolve {function (response: Entries)}
 * @typedef PromiseReject {function (reason: Error)}
 * @typedef ReadFile {async function (response: Entry): Promise<Readable>}
 * @typedef EntryHandler {async function (response: Entry, readFile: ReadFile): Promise<void>}
 * @typedef LoaderInstance {{end: Function, entry: EntryHandler}}
 * @typedef Loader {function (resolve: PromiseResolver, PromiseReject): LoaderInstance}
 */

/**
 * Loads all file content from the zip file.
 *
 * @param resolve {PromiseResolve}
 * @param reject {PromiseReject}
 * @returns {LoaderInstance}
 */
const contentLoader = (resolve, reject) => {
  /** @type {Entries} */
  const data = {};

  const end = () => {
    resolve(data)
  }

  const entry = async (entry, readFile) => {
    if (!entry.fileName.endsWith('/')) {
      data[entry.fileName] = await getStream(await readFile(entry))
    }
  }
  return {end, entry}
}
/**
 * The module level cache for the zip file content.
 *
 * @type {null | Entries}
 */
contentLoader.CACHE = cache();

/**
 * Loads the list of files and directories.
 * The values contain the filename without path, or an empty string for directories.
 *
 * Calling `run` without arguments returns this data,
 * so it can be dumped into `xmltest.json`
 *
 * @see run
 *
 * @param resolve {PromiseResolve}
 * @param reject {PromiseReject}
 * @returns {LoaderInstance}
 */
const entriesLoader = (resolve, reject) => {
  /** @type {Entries} */
  const data = {}
  const end = () => {
    resolve(data)
  }
  const entry = (entry) => {
    data[entry.fileName] = entry.fileName.endsWith('/')
      ? ''
      : path.basename(entry.fileName)
  }
  return {end, entry}
}
entriesLoader.CACHE = cache();

/**
 * Uses `loader` to iterate entries in a zip file using `yauzl`.
 * If `loader.CACHE` is set it is assumed to be an instance of `cache`,
 * and is used to store the resolved result.
 * If `loader.CACHE.has(location)` is true the zip file is not read again,
 * since the cached result is returned.
 * Use `loader.CACHE.delete(location)` or `loader.CACHE.clear()` when needed.
 *
 * @see contentLoader
 * @see contentLoader.CACHE
 * @see entriesLoader
 * @see entriesLoader.CACHE
 *
 * @param loader {Loader} the loader to use (default: `contentLoader`)
 * @param location {string} absolute path to zip file (default: xmltest.zip)
 * @returns {Promise<Entries>}
 */
const load = async (loader = contentLoader, location = path.join(__dirname, 'xmltest.zip')) => {
  if (loader.CACHE && loader.CACHE.has(location)) {
    return {...loader.CACHE.get(location)}
  }

  const zipfile = await promisify(yauzl.open)(
    location, {decodeStrings: true, lazyEntries: true}
  )
  const readFile = promisify(zipfile.openReadStream.bind(zipfile))
  return new Promise((resolve, reject) => {
    const resolver = loader.CACHE
      ? (data) => {
        loader.CACHE.set(location, data);
        resolve(data);
      }
      : resolve;
    const handler = loader(resolver, reject);
    zipfile.on('end', handler.end);
    zipfile.on('entry', async (entry) => {
      await handler.entry(entry, readFile);
      zipfile.readEntry();
    });
    zipfile.readEntry();
  })
}

/**
 * A function that can be passed to functions like `Array.prototype.filter`
 *
 * @typedef Predicate {function (string): boolean}
 */

/**
 * Creates a predicate function ()
 * from one or more of the following:
 * - string (that the value needs to contain)
 * - regular expression (that the value is `.test`ed with)
 * - predicate function
 *
 * @param tests {string | RegExp | Predicate}
 * @returns {Predicate}
 */
const combineFilters = (...tests) => {
  const checks = tests.map(test => {
    if (typeof test === 'function') {
      return test
    }
    let result;
    if (typeof test.test === 'function') {
      result = s => test.test(s)
      result.toString = () => `${test.toString}.test(str)`
    } else {
      result = s => s.includes(test)
      result.toString = () => `str.includes('${test}')`
    }
    return result;
  })
  const result = s => checks.every(check => check(s));
  result.toString = () => `[combineFilters:(str) => ${checks.join(' && ')}]`
  return result;
}

/**
 * Helpful filters based on the directory structure and content of `xmltest.zip`.
 *
 * Top level and nested UPPER_CASE keys represent the directory structure.
 * Inner `files` filters only accept files from that directory (not from nested directories)
 *
 * Top level lower case predicates are for file extensions
 * @see xml
 * @see ent
 */
const FILTERS = {
  INVALID: combineFilters('xmltest/invalid'),
  NOT_WF: {
    EXT_SA: {
      files: combineFilters(/xmltest\/not-wf\/ext-sa\/[^/]+$/),
    },
    NOT_SA: {
      files: combineFilters(/xmltest\/not-wf\/not-sa\/[^/]+$/),
    },
    SA: {
      files: combineFilters(/xmltest\/not-wf\/sa\/[^/]+$/),
    }
  },
  VALID: {
    EXT_SA: {
      files: combineFilters(/xmltest\/valid\/ext-sa\/[^/]+$/),
      OUT: combineFilters('xmltest/valid/ext-sa/out')
    },
    NOT_SA: {
      files: combineFilters(/xmltest\/valid\/not-sa\/[^/]+$/),
      OUT: combineFilters('xmltest/valid/not-sa/out')
    },
    SA: {
      files: combineFilters(/xmltest\/valid\/sa\/[^/]+$/),
      OUT: combineFilters('xmltest/valid/sa/out')
    }
  },
  /**
   * @param s {string}
   * @returns {boolean}
   */
  ent: s => s.endsWith('.ent'),
  /**
   * @param s {string}
   * @returns {boolean}
   */
  xml: s => s.endsWith('.xml')
}

/**
 * Converts path in zipfile (keys of entries or content)
 * to resolve files that are related to a xml file.
 */
const RELATED = {
  /**
   * Returns the name of the `.ent` file with the same name as the given `.xml` file.
   *
   * @param pathInZip {string}
   * @returns {string}
   */
  ent: pathInZip => pathInZip.replace(/\.xml$/, '.ent'),
  /**
   * Returns the name of the related `./out/filename.xml` file with the same name as the given `.xml` file.
   * Be aware that only the `valid` folders have such files.
   *
   * @param pathInZip {string}
   * @returns {string}
   */
  out: pathInZip => [path.dirname(pathInZip), 'out', path.basename(pathInZip)].join('/')
}

/**
 * Filters `data` by applying `filters` to it's keys
 *
 * @see combineFilters
 * @param data {Entries}
 * @param filters {(string | RegExp | Predicate)[]}
 * @returns {string | Entries} the value
 *          if the only filter only results a single entry,
 *          otherwise on object with all keys that match the filter.
 */
const getFiltered = (data, filters) => {
  if (filters.length === 0) return {...data}
  const key = filters[0]
  const isSingleExistingKey = filters.length === 1 && typeof key === 'string' && key in data
  const keys = isSingleExistingKey
    ? [key]
    : Object.keys(data).filter(combineFilters.apply(null, filters))
  return keys.length === 1 && filters.length === 1
    ? data[keys[0]]
    : keys.reduce(
      (acc, key) => {
        acc[key] = data[key]
        return acc
      },
      /** @type {Entries} */{}
    )
}

/**
 * Filters zip file content by applying `filters` to it's keys.
 * It is async since the first invocation loads the content from the zipfile.
 *
 * @see getFiltered
 * @see combineFilters
 * @see load
 *
 * @param filters {string | RegExp | Predicate}
 * @returns {Promise<string | Entries>} the value
 *          if the only filter only results a single entry,
 *          otherwise on object with all keys that match the filter.
 */
const getContent = async (...filters) => getFiltered(await load(), filters)

/**
 * Filters content of `xmltest.json` by applying `filters` to it's keys.
 *
 * @see combineFilters
 * @param filters {string | RegExp | Predicate}
 * @returns {string | Entries} the value
 *          if the only filter only results a single entry,
 *          otherwise on object with all keys that match the filter.
 */
const getEntries = (...filters) => getFiltered(require('./xmltest.json')
  , filters)

/**
 * Makes module executable using `runex`.
 * If the first argument begins with `/`, `./` or `../` and ends with `.zip`,
 * it is removed from the list of filter arguments and used as the path
 * to the archive to load.
 *
 * With no filter arguments: Returns Object structure to store in `xmltest.json`
 *                    `npx runex . > xmltest.json`
 * With one filter argument: Returns content string if exact key match,
 *                    or content dict with filtered keys
 * With more filter arguments: Returns content dict with filtered keys
 *
 * @see getFiltered
 * @see combineFilters
 * @see load
 * @see https://github.com/karfau/runex
 *
 * @param filters {string}
 * @returns {Promise<string | Entries>}
 */
const run = async (...filters) => {
  let file;

  if (filters.length > 0 && /^\.?\.?\/.*\.zip$/.test(filters[0])) {
    file = filters.shift();
  }

  return getFiltered(
    await load(filters.length === 0 ? entriesLoader : contentLoader, file),
    filters
  );
};

const replaceWithWrappedCodePointAt = char => `{!${char.codePointAt(0).toString(16)}!}`

/**
 * Some xml documents (purposely) contain characters that are not visible
 * and make it hard to reason about a test result.
 * Those characters also cause git to think a file is binary,
 * when the test output is being committed (e.g. in a jest snapshot).
 * By replacing them with a visual replacement using `codePointAt`
 * (e.g. replacing NUL/`&#0;` with `{!0!}`,
 * it's makes those more obvious.
 *
 * @param value {string | {toString: function (): string} | undefined}
 * @param wrapper {function (string): string}
 */
const replaceNonTextChars = (value, wrapper = replaceWithWrappedCodePointAt) =>
  value === undefined || value === ''
    ? value
    : value.toString().replace(/[\u0000\u001B\u001F\uDC00\uD800\uFFFE\uFFFF]/gu, wrapper)

module.exports = {
  combineFilters,
  FILTERS,
  RELATED,
  getFiltered,
  getContent,
  getEntries,
  load,
  contentLoader,
  entriesLoader,
  replaceNonTextChars,
  replaceWithWrappedCodePointAt,
  run
}

if (require.main === module) {
  // if you don't want to use `runex` just "launch" this module/package:
  // node xmltest ...
  module.exports.run(...process.argv.slice(2)).then(console.log)
}
