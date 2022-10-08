import { IcaseStep, IgroupItem } from './type'

function dealFlowSteps(ctx: IgroupItem, id: string, list: any = []) {
  const { nodes, edges } = ctx

  let node = nodes.filter((o) => o.id == id)[0]

  if (!node) return list

  if (node.type == 'End') return list
  if (node.type == 'If') {
    let oedge = edges.filter((e) => e.properties.source == 'O' && e.sourceNodeId == id)[0]
    let xedge = edges.filter((e) => e.properties.source == 'X' && e.sourceNodeId == id)[0]

    list.push({
      id,
      assert: node.properties.value,
      O: oedge ? dealFlowSteps(ctx, oedge.targetNodeId, []) : [],
      X: xedge ? dealFlowSteps(ctx, xedge.targetNodeId, []) : [],
    })

    return list
  } else {
    list.push({
      id,
      value: node.properties.value,
    })

    let nextEdge = edges.filter((e) => e.sourceNodeId == id)[0]

    if (!nextEdge) return list

    return dealFlowSteps(ctx, nextEdge.targetNodeId, list)
  }
}

function dealFlow(ctx: IgroupItem) {
  const { nodes, edges } = ctx

  let item = nodes.filter((o) => o.type == 'Start')[0]

  if (!item) return []

  let sedge = edges.filter((e) => e.sourceNodeId == '1')[0]

  if (!sedge) return []

  let list = dealFlowSteps(ctx, sedge.targetNodeId, [])

  return list
}

function dealCaseSteps(sub: IcaseStep[]) {
  let list: any = []
  let L = sub.length

  for (let I = 0; I < L; I++) {
    let obj = sub[I]
    let next = sub[I + 1]

    if (next) {
      if (next._ - next._pt < obj._) {
        let left = [next]
        let right: any = []

        sub.slice(I + 2).forEach((o) => {
          if (o._ - o._pt > obj._) {
            right.push(o)
          } else {
            left.push(o)
          }
        })

        list.push([obj, ...dealCaseSteps(right)])
        list.push(...dealCaseSteps(left))
        return list
      } else {
        list.push(obj)
      }
    } else {
      list.push(obj)
    }
  }

  return list
}

function getEL(hid: string, clone = '') {
  if (clone) {
    return document.querySelector('[hid="' + hid + '"][clone="' + clone + '"]')
  } else {
    return document.querySelector('[hid="' + hid + '"]')
  }
}

export { dealFlow, dealCaseSteps, getEL }
