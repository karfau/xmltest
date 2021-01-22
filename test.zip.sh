#!/bin/sh

mkdir -p data/folder
echo CONTENT > data/folder/file.ext
touch data/folder/empty

(cd data && zip ../test.zip folder folder/*)
