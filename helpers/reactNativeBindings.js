let batchedUpdates;
let runAfterInteractions;

// TODO:
// we should consider implementing an injection-based pattern for
// unstable_batchedUpdates and runAfterInteractions simply because
// - this allows a much easier test-setup, where we don't need to mock modules
// - we can be independent of any folder structure or refactoring
//   that happens in react-native
// - we can provide a default behaviour out-of-the box that gets overwritten
//   when devs inject their favourable behaviour

try {
  require.resolve('react-native');
  batchedUpdates =
    require('react-native/Libraries/Renderer/shims/ReactNative').unstable_batchedUpdates;
  runAfterInteractions =
    require('react-native').InteractionManager.runAfterInteractions;
} catch (e) {
  // if the module is not installed (for example when running tests)
  // we fall back to some defaults that seem to be close to what
  // the original functions implement
  batchedUpdates = (cb) => cb();
  runAfterInteractions = (fn) => setTimeout(() => fn(), 50);
}

export { batchedUpdates, runAfterInteractions };
