import React, { forwardRef, memo } from 'react';
import useTracker from './useTracker';

export default function withTracker(options) {
  return Component => {
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
