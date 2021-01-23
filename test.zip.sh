#!/bin/sh
# Creates test.zip file in the same directory

# clear the folder if it already existed
rm -rf data/folder
# the `data` directory is .gitignored, so we can use it as temp
mkdir -p data/folder
# add one file that has content
echo CONTENT > data/folder/file.ext
# and one empty file
touch data/folder/empty

# It is important for the tests to have the optional `folder` entry in the zip file.
(cd data && zip ../test.zip folder folder/*)
