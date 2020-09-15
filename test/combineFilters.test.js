const {combineFilters} = require('../xmltest')

const FIRST = 'first'
const SECOND = 'second'

describe('combineFilters', () => {
  describe('predicates from strings', () => {
    const first = combineFilters(FIRST);
    const second = combineFilters(SECOND);
    const first_and_second = combineFilters(FIRST, SECOND);
    [
      FIRST, `prefixed ${FIRST}`, `${FIRST} postfixed`, `surrounded ${FIRST}.`
    ].forEach(candidate => {
      test(`${first} matches "${candidate}"`, () => {
        expect(first(candidate)).toBe(true)
      })

      test(`${first_and_second} doesn't matches "${candidate}"`, () => {
        expect(first_and_second(candidate)).toBe(false)
      })

      test(`${second} doesn't matches "${candidate}"`, () => {
        expect(second(candidate)).toBe(false)
      })
    });
    [
      `${FIRST} ${SECOND}`, `prefixed ${FIRST} ${SECOND}`, `${SECOND} ${FIRST} postfixed`
    ].forEach(candidate => {
      test(`${first_and_second} matches "${candidate}"`, () => {
        expect(first_and_second(candidate)).toBe(true)
      })

      test(`${second} matches "${candidate}"`, () => {
        expect(second(candidate)).toBe(true)
      })
    })
  })
})
