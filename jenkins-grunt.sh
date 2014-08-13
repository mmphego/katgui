export PATH=/usr/local/bin:/path/to/node:/path/to/node_bin:/path/to/phantomjs:/path/to/jscoverage:$PATH;

npm install -g grunt-cli
npm install
bower install
grunt build
grunt test