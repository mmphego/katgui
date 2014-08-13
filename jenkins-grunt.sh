#!/usr/bin/bash

# Install the npm requirments as defined in package.json
npm install

# Install the bower requirements
bower install

# Setup the environment
grunt --no-color build

# Run the tests
grunt --no-color test
