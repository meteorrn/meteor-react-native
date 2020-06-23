import { Mongo, packageInterface } from '@meteorrn/core';

const Local = {
    Collection:function (name) {
        const { AsyncStorage } = packageInterface();
        
        const LiveCol = new Mongo.Collection(name);
        const LocalCol = new Mongo.Collection(null);
        const storeLocalCol = async () => {
            await AsyncStorage.setItem("@mrnlocal:" + name, JSON.stringify(LocalCol.find().fetch()));
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