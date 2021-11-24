const Intify = n => Number(n) || 0

export class VData {
  constructor() {
    this.f = 0
    this.delay = 0
    this.te = 0
    // this.dbt = 0
    // this.dbi = false // 是否立刻执行
    this.min = -Infinity
    this.max = Infinity
  }
  Inertia(f) {
    this.f = Math.min(80, Math.abs(Intify(f)))

    return this
  }
  Delay(t) {
    this.delay += Intify(t)

    return this
  }
  Throttle(t) {
    this.te = Intify(t)

    return this
  }
  // Debounce(t) {
  //   this.dbt = Intify(t)
  //   this.dbi = false

  //   return this
  // }
  // DebounceImmediate(t) {
  //   this.dbt = Intify(t)
  //   this.dbi = true

  //   return this
  // }
  // 限制最终计算的最大最小值，结合原值，在 width 属性下，类似于限制 min-width max-width
  Limit(min, max) {
    this.min = min //* Global.designScale
    this.max = max //* Global.designScale 在非编辑器外需要这样处理

    return this
  }
}