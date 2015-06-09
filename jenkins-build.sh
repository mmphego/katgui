#!/usr/bin/bash

# Install the npm requirments as defined in package.json
npm install bower
npm install gulp
sudo npm install -g gulp
npm install

# Install the bower requirements
./node_modules/bower/bin/bower install

GULP_ARGS=''
# Setup the environment
gulp $GULP_ARGS build

# Run the tests
gulp $GULP_ARGS test

#
