import React, { forwardRef, memo } from 'react';
import useTracker from './useTracker';

/**
 * Wraps a component/App, so it runs, once the data
 * is available and re-runs, if the data changes
 *
 * @example
 * let AppContainer = withTracker(() => {
 *   Meteor.subscribe('myThing');
 *   let myThing = MyCol.findOne();
 *
 *   return {
 *     myThing,
 *   };
 * })(App);
 *
 * export default AppContainer;
 * @param options
 * @returns {function(React.Component):React.NamedExoticComponent}
 */
export default function withTracker(options) {
  return (Component) => {
    const expandedOptions =
      typeof options === 'function' ? { getMeteorData: options } : options;
    const { getMeteorData, pure = true } = expandedOptions;

    const WithTracker = forwardRef((props, ref) => {
      const data = useTracker(() => getMeteorData(props) || {}, [props]);
      return React.createElement(Component, { ref, ...props, ...data });
    });

    return pure ? memo(WithTracker) : WithTracker;
  };
}
