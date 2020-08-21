# xmltest

Redistribution of <ftp://ftp.jclark.com/pub/xml/xmltest.zip> as an npm package.
The linked zip file was taken from <http://www.jclark.com/xml/> which describes it's purpose and links more related resources.

## There is a different license for `xmltest.zip`

It is stated as part of the `readme.html` that is contained in it:

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
1. The first level declares how "well defined" the contained files are: `valid`, not wellformed (`not-wf`), `invalid`
2. The second level seperates standalone (`sa`) files from files that are not standalone (`not-sa`) or have dependencies to external entities (`ext-sa`)
3. (Only inside `valid`) the `out` folder contains the canonical representation of the test cases, which can be useful as an expected value.

## Usage

TBD: `npm install -D github:karfau/xmltest`

TBD: The `xmltest.zip` file is extracted into `node_modules/xmltest/` as part of `postinstall`.

'''If you think it's a violation of the license provided by James Clark, please let me know.'''

## Related Resources

- TBD

