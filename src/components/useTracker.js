import { useEffect, useRef, useReducer, useMemo } from 'react';
import Tracker from '../Tracker.js';

const fur = (x: number): number => x + 1;
const useForceUpdate = () => useReducer(fur, 0)[1];
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
      Tracker.autorun(currentComputation => {
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
