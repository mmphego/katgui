#!/usr/bin/bash

# Install the npm requirments as defined in package.json
npm install
npm install bower
npm install grunt-cli

# Install the bower requirements
./node_modules/bower/bin/bower install

GRUNT_ARGS=''
# Setup the environment
./node_modules/grunt-cli/bin/grunt $GRUNT_ARGS build

# Run the tests
./node_modules/grunt-cli/bin/grunt $GRUNT_ARGS test

#
