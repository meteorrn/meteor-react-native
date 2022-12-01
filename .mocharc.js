// transpile all es6+ code in this project (but not node_modules)
const babelRegister = require('@babel/register');
babelRegister();

// for more options see here https://github.com/mochajs/mocha/blob/master/example/config/.mocharc.yml
module.exports = {
  recursive: true,
  reporter: "spec",
  retries: 0,
  slow: 20,
  timeout: 2000,
  ui: "bdd",
  require: ['test/hooks/mockServer.js']
}
