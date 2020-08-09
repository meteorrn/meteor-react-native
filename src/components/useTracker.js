import { useEffect, useState } from 'react';
import Tracker from 'trackr';
import Data from '../Data';

export default (trackerFn, deps = []) => {
    const [response, setResponse] = useState(trackerFn());
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

    useEffect(() => {
        stopComputation();
        Tracker.autorun(currentComputation => {
            meteorDataDep.depend();
            computation = currentComputation;
            setResponse(trackerFn());
        });
        return () => { stopComputation(); Data.offChange(dataChangedCallback); };
    }, deps);
    return response;
};
