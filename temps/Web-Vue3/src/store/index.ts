import { store } from './tree'

export function setupStore(app) {
  app.$store = store
}

export const $store = store