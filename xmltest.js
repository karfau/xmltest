const entries = require('./xmltest.json')
const getStream = require('get-stream')
const path = require('path')
const {promisify} = require('util')
const yauzl = require('yauzl')
// for type definitions
const {Entry} = require('yauzl')

/**
 * @typedef PromiseResolve {function (response: typeof entries)}
 * @typedef PromiseReject {function (reason: Error)}
 * @typedef ReadFile {async function (response: Entry): Promise<Readable>}
 * @typedef EntryHandler {async function (response: Entry, readFile: ReadFile): Promise<void>}
 * @typedef LoaderInstance {{end: Function, entry: EntryHandler}}
 * @typedef Loader {function (resolve: PromiseResolver, PromiseReject): LoaderInstance}
 */

/**
 * Loads all file content from the zip file and caches it
 *
 * @param resolve {PromiseResolve}
 * @param reject {PromiseReject}
 * @returns {LoaderInstance}
 */
const dataLoader = (resolve, reject) => {
  if (dataLoader.DATA) {
    resolve({...dataLoader.DATA})
  }
  /** @type {Partial<typeof entries>} */
  const data = {}

  const end = () => {
    dataLoader.DATA = data
    resolve(dataLoader.DATA)
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
 * @type {null | typeof entries}
 */
dataLoader.DATA = null

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
const jsonLoader = (resolve, reject) => {
  /** @type {Partial<typeof entries>} */
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

/**
 * Uses `loader` to iterate entries in a zipfile using `yauzl`.
 *
 * @see dataLoader
 * @see jsonLoader
 *
 * @param loader {Loader} the loader to use (default: `dataLoader`)
 * @param location {string} absolute path to zip file (default: xmltest.zip)
 * @returns {Promise<typeof entries>}
 */
const load = async (loader = dataLoader, location = path.join(__dirname, 'xmltest.zip')) => {
  if (loader.DATA) {
    return {...loader.DATA}
  }

  const zipfile = await promisify(yauzl.open)(
    location, {decodeStrings: true, lazyEntries: true}
  )
  const readFile = promisify(zipfile.openReadStream.bind(zipfile))
  return new Promise((resolve, reject) => {
    const handler = loader(resolve, reject)
    zipfile.on('end', handler.end)
    zipfile.on('entry', async (entry) => {
      await handler.entry(entry, readFile)
      zipfile.readEntry()
    })
    zipfile.readEntry()
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
    if (typeof test.test === 'function') {
      return s => test.test(s)
    }
    return s => s.includes(test)
  })
  return s => checks.every(check => check(s))
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
 * @param data {typeof entries}
 * @param filters {(string | RegExp | Predicate)[]}
 * @returns {string | Partial<typeof entries>} the value
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
      /** @type {Partial<typeof entries>} */{}
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
 * @returns {Promise<string | Partial<typeof entries>>} the value
 *          if the only filter only results a single entry,
 *          otherwise on object with all keys that match the filter.
 */
const getContent = async (...filters) => getFiltered(await load(), filters)

/**
 * Filters content of `xmltest.json` by applying `filters` to it's keys.
 *
 * @see combineFilters
 * @param filters {string | RegExp | Predicate}
 * @returns {string | Partial<typeof entries>} the value
 *          if the only filter only results a single entry,
 *          otherwise on object with all keys that match the filter.
 */
const getEntries = (...filters) => getFiltered(entries, filters)

/**
 * Makes module executable using `runex`.
 * With no arguments: Returns Object structure to store in `xmltest.json`
 *                    `npx runex . > xmltest.json`
 * With one argument: Returns content string if exact key match,
 *                    or content dict with filtered keys
 * With more arguments: Returns content dict with filtered keys
 *
 * @see getFiltered
 * @see combineFilters
 * @see load
 *
 * @param filters {(string | RegExp | Predicate)[]}
 * @returns {Promise<string | Partial<typeof entries>>}
 */
const run = async (...filters) => filters.length === 0
  ? getEntries()
  : getContent.apply(null, filters)

const replaceWithWrappedCodePointAt = char => `{!${char.codePointAt(0)}!}`
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
    : value.toString().replace(/[\p{Cc}\uFFFF]/gu, wrapper)

module.exports = {
  combineFilters,
  FILTERS,
  RELATED,
  getFiltered,
  getContent,
  getEntries,
  load,
  replaceNonTextChars,
  replaceWithWrappedCodePointAt,
  run
}

if (require.main === module) {
  // if you don't want to use `runex` just "launch" this module/package
  module.exports.run().then(console.log)
}

