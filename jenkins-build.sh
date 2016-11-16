#!/usr/bin/bash

# Install the npm requirments as defined in package.json
sudo npm install -g gulp
yarn install

GULP_ARGS=''
# Setup the environment
gulp $GULP_ARGS build

# Run the tests
# disable running tests for now because angular 1.5 doesnt play well with phantomjs1.x
# need to upgrade to phantomjs2 and fix dependency injection when running tests
# gulp $GULP_ARGS test
