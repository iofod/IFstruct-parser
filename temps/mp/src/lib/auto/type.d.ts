import { GlobalObject } from '../../components/type'

type Ioffset = {
  dx: number
  dy: number
}

type Imotion = {
  x: number
  y: number
  dx: number
  dy: number
}

interface IcaseStep {
  event: string
  flag: string
  hid: string
  clone: string
  index: number
  pid: string
  color?: string
  context: GlobalObject
  _pt: number
  hash: string
  offset: Ioffset
  name: string
  useContext: boolean
  _: number
}

interface IcaseRecord {
  [key: string]: Imotion[]
}

interface IcaseItem {
  steps: IcaseStep[]
  interactionRecord: IcaseRecord
}

type Inode = {
  id: string
  type: string
  x: number
  y: number
  properties: GlobalObject
  text: any
}

type Iedge = {
  id: string
  type: string
  sourceNodeId: string
  targetNodeId: string
  startPoint?: any
  endPoint?: any
  properties: GlobalObject
  source?: string
}

interface IgroupItem {
  nodes: Inode[]
  edges: Iedge[]
}

interface Icase {
  name: string
  id: string
  type: string
  conf: IcaseItem | IgroupItem
}

export { Icase, IcaseStep, IgroupItem }