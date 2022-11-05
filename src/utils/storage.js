import { openDB } from "idb";

const defaultDbName = "nulp-timetable";
const defaultStoreName = "cache";
const cachedKevals = {};

function keval(dbPromise, storeName) {
    if (cachedKevals[storeName]) {
        return cachedKevals[storeName];
    }

    return cachedKevals[storeName] = {
        keys: () => dbPromise.then(db => db.getAllKeys(storeName)),
        clear: () => dbPromise.then(db => db.clear(storeName)),
        deleteItem: (key) => dbPromise.then(db => db.delete(storeName, key)),
        getItem: (key) => dbPromise.then(db => db.get(storeName, key)),
        setItem: (key, val) => dbPromise.then(db => db.put(storeName, val, key)),
    };
}

const DEFAULT_DB_PROMISE = openDB(defaultDbName, 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
            db.createObjectStore(defaultStoreName);
    },
});

const storage = keval(DEFAULT_DB_PROMISE, defaultStoreName);

export default storage;