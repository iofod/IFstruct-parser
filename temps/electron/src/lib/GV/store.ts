export const getLocal = (key) => JSON.parse(localStorage.getItem(key) || '{}') || {}
export const saveLocal = (key, value) => localStorage.setItem(key, JSON.stringify(value))
export const removeLocal = (key) => localStorage.removeItem(key)

export const getSession = (key) => JSON.parse(sessionStorage.getItem(key) || '{}') || {}
export const saveSession = (key, value) => sessionStorage.setItem(key, JSON.stringify(value))
export const removeSession = (key) => sessionStorage.removeItem(key)

export const GStorage = {
  local: {
    get: getLocal,
    save: saveLocal,
    remove: removeLocal,
  },
  session: {
    get: getSession,
    save: saveSession,
    remove: removeSession,
  },
}
