
import React, { forwardRef, memo } from 'react';
import useTracker from './useTracker';

type ReactiveFn = (props: object) => any;
type ReactiveOptions = {
  getMeteorData: ReactiveFn;
  pure?: boolean;
  skipUpdate?: (prev: any, next: any) => boolean;
}

export default function withTracker(options: ReactiveFn | ReactiveOptions) {
  return (Component) => {
    const expandedOptions = typeof options === 'function' ? { getMeteorData: options } : options;
    const { getMeteorData, pure = true } = expandedOptions;
    const WithTracker = forwardRef((props, ref) => {
      const data = useTracker(
        () => {return getMeteorData(props) || {}},
        [options, props]
      );
      
      return (
        <Component ref={ref} {...props} {...data} />
      );
    });

    return pure ? memo(WithTracker) : WithTracker;
  };
}