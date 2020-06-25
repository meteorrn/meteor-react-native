import { Mongo, packageInterface } from '@meteorrn/core';

const stringifiedDateRegExp = new RegExp(/[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.[0-9]{3}Z/);
let fixDates = function (k,v) {
    if(stringifiedDateRegExp.test(v)) {
        return new Date(v);
    }
    return v;
};

const defaultOptions = {disableDateParser:false};
const Local = {
    Collection:function (name, _options={}) {
        const { AsyncStorage } = packageInterface();
        const options = Object.assign({}, defaultOptions, _options);
        
        const LiveCol = new Mongo.Collection(name);
        const LocalCol = new Mongo.Collection(null);
        const storeLocalCol = async () => {
            await AsyncStorage.setItem("@mrnlocal:" + name, JSON.stringify(LocalCol.find().fetch(), options.disableDateParser ? v=>v : fixDates));
        };
        
        const loadData = async () => {
            const storedData = await AsyncStorage.getItem("@mrnlocal:" + name);
            
            if(storedData) {
                const documents = JSON.parse(storedData);
                documents.forEach(doc => {
                    LocalCol._collection.upsert(doc);
                });
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
        
        return LocalCol;
    }
};

export default Local;