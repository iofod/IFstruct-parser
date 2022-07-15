export interface GlobalObject {
  [key: string]: any
}

export interface IFstate {
  id?: string | number
  name: string
  active: boolean
  style: GlobalObject
  custom: GlobalObject
  [key: string]: any
}
