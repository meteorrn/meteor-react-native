import { useEffect, useState, useRef, useReducer, useMemo } from 'react';
import Tracker from '../Tracker.js';
import Data from '../Data';


const fur = (x: number): number => x + 1;
const useForceUpdate = () => useReducer(fur, 0)[1];
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

    
    useMemo(() => {
        stopComputation();
        Tracker.autorun(currentComputation => {
            if( refs.stopped)
            {
                return;
            }
            
            meteorDataDep.depend();
            computation = currentComputation;
            refs.data = trackerFn()
            forceUpdate()
        });
        return () => { stopComputation(); Data.offChange(dataChangedCallback); };
    }, deps);
    useEffect(()=>{
         return () => { 
            refs.stopped = true
            stopComputation(); Data.offChange(dataChangedCallback); 
        };
    },[])
    return refs.data;
};
