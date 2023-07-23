import { useEffect, useRef, useReducer, useMemo } from 'react';
import Tracker from '../Tracker.js';

function useForceUpdate() {
  const [, forceUpdate] = useState(0);

  return useCallback(() => {
    forceUpdate((s) => s + 1);
  }, []);
}

export default (trackerFn, deps = [], skipUpdate) => {
  if (skipUpdate && !typeof skipUpdate === 'function') {
    console.warn(
      'skipUpdate must be a function. Usage: (prev, next) => {return true; to skip} '
    );
  }

  const { current: refs } = useRef({
    data: null,
    meteorDataDep: new Tracker.Dependency(),
    trackerFn: trackerFn,
    computation: null,
    isMounted: true,
  });
  const forceUpdate = useForceUpdate();
  refs.trackerFn = trackerFn;

  useMemo(() => {
    if (refs.computation) {
      refs.computation.stop();
      refs.computation = null;
    }
    Tracker.nonreactive(() => {
      Tracker.autorun((currentComputation) => {
        if (refs.isMounted) {
          refs.computation = currentComputation;
          refs.data = trackerFn();
          if (
            !(
              skipUpdate &&
              typeof skipUpdate === 'function' &&
              skipUpdate(prev, data)
            )
          ) {
            forceUpdate();
          }
        } else {
          refs.computation?.stop();
        }
      });
    });
  }, deps);

  useEffect(() => {
    return () => {
      refs.isMounted = false;
      refs.computation?.stop();
      refs.computation = null;
    };
  }, []);

  return refs.data;
};
