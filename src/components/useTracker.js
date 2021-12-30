import { useEffect, useState, useRef, useReducer, useMemo,useCallback } from 'react';
import Tracker from '../Tracker.js';
import Data from '../Data';


const fur = (x: number): number => x + 1;
const useForceUpdate = () => useReducer(fur, 0)[1];
export default (trackerFn, deps = []) => {
    const { current: refs } = useRef({data: null,
    meteorDataDep: new Tracker.Dependency(),
    trackerFn: trackerFn,
    computation: null
    });
    const forceUpdate = useForceUpdate()
    refs.trackerFn = trackerFn

     useMemo(() => {
        refs.computation =Tracker.nonreactive(()=>{
            Tracker.autorun(currentComputation => {
                refs.data = trackerFn()
            });
        })
        setTimeout(() => {
            if(refs.computation)
            {
                refs.computation.stop()
                refs.computation = null
            }
        }, 1);
    }, deps);
    
    useEffect(() => {
        if(refs.computation)
        {
            refs.computation.stop()
            refs.computation = null
        }

        const computation =Tracker.nonreactive(()=>{
        Tracker.autorun((c) => {
            refs.data = refs.trackerFn(c)
            forceUpdate()
        });
        return ()=>{
            computation.stop()
        }
         } )
    }, deps);
   
    return refs.data;
};
