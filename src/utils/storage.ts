import { openDB, IDBPDatabase } from "idb";

const DEFAULT_DB_NAME = "nulp-timetable";
const DEFAULT_STORE_NAME = "cache";

const DEFAULT_DB_PROMISE = openDB(DEFAULT_DB_NAME, 2, {
    upgrade(db) {
            db.createObjectStore(DEFAULT_STORE_NAME);
    },
});


type CachedStorageType = {[key: string]: {
    keys: () => Promise<number[] | IDBValidKey[]>,
    clear: () => Promise<void>,
    deleteItem: (key: IDBKeyRange | IDBValidKey) => Promise<void>,
    getItem: (key: IDBKeyRange | IDBValidKey) => Promise<any>,
    setItem: (key: IDBKeyRange | IDBValidKey, val: any) => Promise<void | IDBValidKey>,
}};

const cachedStorage: CachedStorageType = {};

function getStorage(dbPromise: Promise<IDBPDatabase<unknown>>, storeName: string) {
    if (cachedStorage[storeName]) {
        return cachedStorage[storeName];
    }

    return cachedStorage[storeName] = {
        keys: () => dbPromise.then(db => db.getAllKeys(storeName)),
        clear: () => dbPromise.then(db => db.clear(storeName)),
        deleteItem: (key: IDBKeyRange | IDBValidKey) => dbPromise.then(db => db.delete(storeName, key)),
        getItem: (key: IDBKeyRange | IDBValidKey) => dbPromise.then(db => db.get(storeName, key)),
        setItem: (key: IDBKeyRange | IDBValidKey, val: any) => dbPromise.then(db => db.put(storeName, val, key)),
    };
}



const storage = getStorage(DEFAULT_DB_PROMISE, DEFAULT_STORE_NAME);

export default storage;