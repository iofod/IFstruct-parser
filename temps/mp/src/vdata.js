const Intify = n => Number(n) || 0

export class VData {
  constructor() {
    this.f = 0
    this.delay = 0
    this.te = 0
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
  // 限制最终计算的最大最小值，结合原值，在 width 属性下，类似于限制 min-width max-width
  Limit(min, max) {
    this.min = min
    this.max = max

    return this
  }
}