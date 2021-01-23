# xmltest

Redistribution of <ftp://ftp.jclark.com/pub/xml/xmltest.zip> as a npm package to make it easy to access the test cases from javascript.
The linked zip file is from <http://www.jclark.com/xml/> which describes it's purpose and links more related resources.

## There is a different license for `xmltest.zip`

The zip file contains a `readme.html` that states:

> Copyright (C) 1998 James Clark.  All rights reserved.  Permission is
granted to copy and modify this collection in any way for internal use
within a company or organization.  Permission is granted to
redistribute the file <code>xmltest.zip</code> containing this
collection to third parties provided that no modifications of any kind
are made to this file.  Note that permission to distribute the
collection in any other form is not granted.

## What is it good for?

It contains may different (test) cases that an XML parser might want to verify it parses correctly.
They are sorted into folders:
0. top level `xmltest` folder
1. The first level declares how "well defined" the contained files are: `valid`, not well formed (`not-wf`), `invalid`
2. The second level separates standalone (`sa`) files from files that are not standalone (`not-sa`) or have dependencies to external entities (`ext-sa`)
3. (Only inside `valid`) the `out` folder contains the canonical representation of the test cases, which can be useful as an expected value. (The zipfile also contains `canonical.html` that described that term in more details.)

```
xmltest
├── invalid
├── not-wf
│   ├── ext-sa
│   ├── not-sa
│   └── sa
└── valid
    ├── ext-sa
    │   └── out
    ├── not-sa
    │   └── out
    └── sa
        └── out
```

## Usage

### Install

- `npm install -D github:karfau/xmltest`

### In tests

- In you tests:

```javascript
const xmltest = require('xmltest');
//or import xmltest from 'xmltest';

describe('unit', () => {
    // filter the ones relevant for your tests
    // `{'path/to/file.ext': 'file.ext', ...}`
    const cases = xmltest.getEntries(
        xmltest.filters.VALID.SA.files,
        xmltest.filters.xml
    )
    for (const [pathInZip, filename] of Object.entries(cases)) {
        test(`should match valid standalone ${filename}`, async () => {
            const input = await xmltest.getContent(pathInZip);
            const expected = await xmltest.getContent(
              xmltest.RELATED.relative_out(pathInZip)
            )         
            // your test here
        }); 
    }
});
```

### command line interface

- `node xmltest` or `npx xmltest` will print all entries as JSON, similar to calling `getEntries`
- passing one or multiple arguments will use them with `createFilters` 
  and return the filtered content in the same way as `getContent` does:
  - with **only** one argument and a single matching entry it only returns the content itself
  - otherwise, it returns a json where the keys are the path inside the zip file, and the values are the content
   

### Extract & Inspect zip content

In case the command line interface is not sufficient, 
`npm run extract` will extract `xmltest.zip` into the `.gitignore`d `data` directory.


'''If you think it's a violation of the license offered by James Clark, please [let me know](mailto:coder@karfau.de).'''

### API

All methods have doc comments that include types.

- `combineFilters`
- `FILTERS`
- `RELATED`
- `getFiltered`
- `getContent`
- `getEntries`
- `load`
- `contentLoader`
- `entriesLoader`
- `replaceWithWrappedCodePointAt`
- `replaceNonTextChars`
- `run`

(Feel free to contribute by automating the extraction of the documentation to this or another file.)

### with different zip files

The API can be used with other zip files by passing relative or absolute file names as arguments:
- `load` (second argument)
- `run` (first argument)

## Related Resources

- The page of the author linking to xmltest.zip: <http://www.jclark.com/xml/>
- The way I found those testcases since they are part of a bigger testsuite for (Java SAX parsers) <http://cafeconleche.org/SAXTest/>
- The W3C also provides an XML test suite: <https://www.w3.org/XML/Test/> (the files in `xmltest.zip` are part of this but there is no clear license for the whole package)
- The PR that initially led to the creation of this package: <https://github.com/xmldom/xmldom/pull/112>
