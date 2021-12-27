import { useEffect, useState, useRef, useReducer } from 'react';
import Tracker from '../Tracker.js';
import Data from '../Data';


const fur = (x: number): number => x + 1;
const useForceUpdate = () => React.useReducer(fur, 0)[1];
export default (trackerFn, deps = []) => {
    const { current: refs } = useRef({data: null});
    const forceUpdate = useForceUpdate()
    
    const meteorDataDep = new Tracker.Dependency();
    let computation = null;
    const dataChangedCallback = () => {
        meteorDataDep.changed();
    };

    const stopComputation = () => {
        computation && computation.stop();
        computation = null;
    };

    Data.onChange(dataChangedCallback);

    
    React.useMemo(() => {
        stopComputation();
        Tracker.autorun(currentComputation => {
            meteorDataDep.depend();
            computation = currentComputation;
            refs.data = trackerFn()
            forceUpdate()
        });
        return () => { stopComputation(); Data.offChange(dataChangedCallback); };
    }, deps);
    return refs.data;
};
