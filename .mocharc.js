// transpile all es6+ code in this project (but not node_modules)
const babelRegister = require('@babel/register');
babelRegister();
console.debug(process.cwd())

// stub out any dependencies that will mess-up our tests just
// because they either require complex transpilation or
// certain environment setups
// const proxyquire =  require('proxyquire');
//
// let stub = {};
// stub["@noCallThru"] = true;
//
// proxyquire('./src/Data', { 'react-native/Libraries/Renderer/shims/ReactNative': stub });


// for more options see here https://github.com/mochajs/mocha/blob/master/example/config/.mocharc.yml
module.exports = {
  recursive: true,
  reporter: "spec",
  retries: 0,
  slow: 20,
  timeout: 2000,
  ui: "bdd"
}
