import { Mongo, packageInterface } from '@meteorrn/core';

const stringifiedDateRegExp = new RegExp(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/);
let fixDates = function (k,v) {
    if(stringifiedDateRegExp.test(v)) {
        return new Date(v);
    }
    return v;
};

const defaultOptions = {disableDateParser:false, batchUpdates:false};
const Local = {
    Collection:function (name, _options={}) {
        const { AsyncStorage } = packageInterface();
        const options = Object.assign({}, defaultOptions, _options);
        
        const LiveCol = new Mongo.Collection(name);
        const LocalCol = new Mongo.Collection(null);
        let batchQueued = false;
        
        const _storeLocalCol = async () => {
            batchQueued = false;
            const data = LocalCol.find({}, {sort:options.sort}).fetch();
            if(options.groupBy) {
                const groups = {};
                
                for(let d of data) {
                    const v = d[options.groupBy];
                    groups[v] = groups[v] || [];
                    groups[v].push(d);
                }
                
                for(let g in groups) {
                    await AsyncStorage.setItem("@mrnlocal:" + name + ":" + g, JSON.stringify(groups[g].slice(0, options.limit)));
                }
                
                await AsyncStorage.setItem("@mrnlocal:" + name + "_groups", JSON.stringify(Object.keys(groups)));
            }
            else {
                await AsyncStorage.setItem("@mrnlocal:" + name, JSON.stringify(data));
            }
        };
        
        const storeLocalCol = async () => {
            if(options.batchUpdates) {
                if(batchQueued) {
                    return;
                }
                else {
                    batchQueued = true;
                    setTimeout(_storeLocalCol, 150);
                    return;
                }
            }
            else {
                await _storeLocalCol();
            }
        }
        
        const loadData = async () => {
            
            if(options.groupBy) {
                let groups = JSON.parse((await AsyncStorage.getItem("@mrnlocal:" + name + "_groups")) || "[]");
                for(let g of groups) {
                    const storedData = await AsyncStorage.getItem("@mrnlocal:" + name + ":" + g);
                    if(storedData) {
                        const documents = JSON.parse(storedData, options.disableDateParser ? v=>v : fixDates);
                        documents.forEach(doc => {
                            LocalCol._collection.upsert(doc);
                        });                        
                    }
                }
            }
            else {
                const storedData = await AsyncStorage.getItem("@mrnlocal:" + name);
                if(storedData) {
                    const documents = JSON.parse(storedData, options.disableDateParser ? v=>v : fixDates);
                    documents.forEach(doc => {
                        LocalCol._collection.upsert(doc);
                    });
                }
            }
            
            LiveCol.find({}).observe({
                added:async doc => {
                    LocalCol._collection.upsert(doc);
                    storeLocalCol();
                },
                changed:async doc => {
                    LocalCol._collection.upsert(doc);
                    storeLocalCol();
                }
            });
        };
        
        LocalCol.loadPromise = loadData();
        LocalCol.save = storeLocalCol;
        
        return LocalCol;
    }
};

export default Local;
