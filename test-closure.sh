#!/bin/bash

# Remember to run bin/cake build first if you have updated the CoffeeScript source!

# In order to iterate on this, it is probably best to run the following:
#
#	  git checkout lib/*.js && bin/cake build && bin/cake build:parser && ./test-closure.sh
#
# vjpr: I use the command below instead otherwise it can't find the `jison` module:
#
# 	git checkout lib/*.js && bin/cake build:full && ./test-closure.sh
#
# This way, if there is an error during the build, `git checkout` is used to
# "reset" the build so that it is possible to rebuild.
#
# Also, it appears to be important to regenerate grammar.js before building the
# parser. (Writing the build tools in the language you are building can get
# confusing sometimes.)

set -e
mkdir -p build/closure/test
bin/coffee --google -b -o build/closure/test -c closure/test/*.coffee

echo "// === abstractperson.js ==="
cat build/closure/test/abstractperson.js

echo "// === person.js ==="
cat build/closure/test/person.js

echo "// === adult.js ==="
cat build/closure/test/adult.js

mkdir -p build/closure/no-google-libs
bin/coffee --closure -b -o build/closure/test/no-google-libs -c closure/test/no-google-libs/*.coffee

echo "// === test.js ==="
cat build/closure/test/no-google-libs/test.js