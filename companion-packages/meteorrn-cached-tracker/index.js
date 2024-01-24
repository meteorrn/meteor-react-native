import { useTracker, packageInterface } from "@meteorrn/core";
import { useCallback, useEffect, useState } from "react";

const { AsyncStorage } = packageInterface();

const replacer = (_key, value) =>
  value instanceof Date ? value.toISOString() : value;

const reviver = (_key, value) =>
  typeof value === "string" &&
  value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    ? new Date(value)
    : value;

export const useCachedTracker = (
  trackerFn,
  trackerDeps,
  subReady,
  getOfflineData,
  cacheKey = JSON.stringify(trackerDeps.join("-"))
) => {
  const cachename = "@cachedTracker:" + cacheKey;
  const [data, setData] = useState({});
  const [ready, setReady] = useState(false);
  const [offlineReady, setOfflineReady] = useState();

  const storeDataInCache = useCallback(async () => {
    /**
     * Only store and refresh ui, if ready data is available
     */
    if (!getOfflineData) {
      if (trackerData) {
        if (subReady) {
          await AsyncStorage.setItem(
            cachename,
            JSON.stringify(trackerData, replacer)
          );
          setData(trackerData);
        }
      }
    }
  });

  /**
   * Load data from cache if available
   */
  const getDataFromCache = useCallback(async () => {
    const cachedData = await AsyncStorage.getItem(cachename);
    if (cachedData) {
      const dataObjekt = JSON.parse(cachedData, reviver);
      setData(dataObjekt);
      setOfflineReady(true);
    }
  });

  const trackerData = useTracker(trackerFn, trackerDeps);

  useEffect(() => {
    setReady(subReady || offlineReady);
  }, [offlineReady, subReady]);

  /**
   * Store data in offline cache if !getOfflineData and subscription is ready
   */
  useEffect(() => {
    storeDataInCache();
  }, [trackerData, getOfflineData, subReady, cacheKey]);

  /**
   * Load offline data if not !getOfflineData or subscription is not ready yet
   */
  useEffect(() => {
    if (getOfflineData || !subReady) {
      getDataFromCache();
    }
  }, [getOfflineData, subReady, ...trackerDeps, cacheKey]);

  return {
    data,
    ready,
  };
};