/*
  Purpose of this file is to set up DOM so Mocha can test front-end code
  entirely within Node. This is required by Mocha CLI command.
*/
let path = require("path");

// Point to right tsconfig
require("ts-node").register({
  project: path.join(__dirname, "tsconfig.test.json")
});
