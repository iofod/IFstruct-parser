import { GStorage } from './store'

let storageType = 'local' // session | local

export const getStorage = (K) => GStorage[storageType].get(K)
export const removeStorage = (K) => GStorage[storageType].remove(K)
export const saveStorage = (K, V) => GStorage[storageType].save(K, V)
export const updateStorage = (K, V) => saveStorage(K, { ...getStorage(K), ...V })
