#!/bin/bash

# Downloads an Eclipse syntax-highlighting plugin for Eclipse named
# ColorEditor (http://www.gstaff.org/colorEditor/) and modifies it
# to support syntax highlighting for CoffeeScript.
#
# Adapted from manual instructions at
# http://stackoverflow.com/questions/4246024/coffeescript-editor-for-macos

set -e

BUILD_DIR=build.cbg
JAR=cbg.editor_1.2.6.jar

# Create a temporary directory and download the original jar.
mkdir -p ${BUILD_DIR}
pushd ${BUILD_DIR}
wget http://www.gstaff.org/colorEditor/${JAR}

# Extract the contents of the jar and edit the necessary files.
jar -xf ${JAR}
sed -i -e 's#,cls#,cls,coffee#' plugin.xml
pushd modes
sed -i -e 's#</MODES>#<MODE NAME="coffee" FILE="coffeescript.xml" FILE_NAME_GLOB="*.coffee" /></MODES>#' catalog

# Optional: Remove the stuff about ### being a block comment because
# the CoffeeScript source code uses #### to indicate a heading
# (for its documentation generator), which is then treated as an open
# block comment that is never closed.
wget https://raw.github.com/dhotson/coffeescript-jedit/master/coffeescript.xml
sed -i -e '/commentStart/d' coffeescript.xml
sed -i -e '/commentEnd/d' coffeescript.xml
sed -i -e '/<SPAN TYPE="COMMENT2">/,/<\/SPAN>/D' coffeescript.xml

# Remove the downloaded jar and pop back to the original directory.
popd
rm ${JAR}
popd

# Create the new jar file.
# Be sure to use -M so that the original manifest is not overwritten.
jar -cMf ${JAR} -C ${BUILD_DIR} .
rm -rf ${BUILD_DIR}

echo "Add ${JAR} to your \$ECLIPSE_HOME/plugins directory and restart Eclipse with the -clean flag."
