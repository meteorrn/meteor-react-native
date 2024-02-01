import { useEffect, useRef, useReducer, useMemo } from 'react';
import Tracker from '../Tracker.js';

/** @private */
const increment = (x) => x + 1;
/** @private */
const useForceUpdate = () => useReducer(increment, 0)[1];

/**
 * Hook that re-runs any time a reactive data is changed.
 * TODO: make work with async functions.
 *
 * Reactive data sources that trigger a re-run are, for example:
 * - ReactiveDict.prototype.get
 * - Meteor.user() calls
 * - Meteor.status() calls
 * - subscription handles
 *
 * @param trackerFn {function}
 * @param deps
 * @returns {null}
 */
export default (trackerFn, deps = []) => {
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
          forceUpdate();
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
