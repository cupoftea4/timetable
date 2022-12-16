import { openDB } from "idb";

const DEFAULT_DB_NAME = "nulp-timetable";
const DEFAULT_STORE_NAME = "cache";

const DEFAULT_DB_PROMISE = openDB(DEFAULT_DB_NAME, 2, {
    upgrade(db) {
            db.createObjectStore(DEFAULT_STORE_NAME);
    },
});

const cachedStorage = {};

function getStorage(dbPromise, storeName) {
    if (cachedStorage[storeName]) {
        return cachedStorage[storeName];
    }

    return cachedStorage[storeName] = {
        keys: () => dbPromise.then(db => db.getAllKeys(storeName)),
        clear: () => dbPromise.then(db => db.clear(storeName)),
        deleteItem: (key) => dbPromise.then(db => db.delete(storeName, key)),
        getItem: (key) => dbPromise.then(db => db.get(storeName, key)),
        setItem: (key, val) => dbPromise.then(db => db.put(storeName, val, key)),
    };
}



const storage = getStorage(DEFAULT_DB_PROMISE, DEFAULT_STORE_NAME);

export default storage;