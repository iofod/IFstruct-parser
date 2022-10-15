const Intify = (n: any) => Number(n) || 0

export class VData {
  delay = 0
  f = 0
  te = 0
  min = -Infinity
  max = Infinity
  constructor() {
  }
  Inertia(f: any) {
    this.f = Math.min(80, Math.abs(Intify(f)))

    return this
  }
  Delay(t: any) {
    this.delay += Intify(t)

    return this
  }
  Throttle(t: any) {
    this.te = Intify(t)

    return this
  }
  Limit(min: number, max: number) {
    this.min = min
    this.max = max

    return this
  }
}
