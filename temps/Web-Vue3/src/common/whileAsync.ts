class FakeWhile {
  mark = 'RUNNING'
  constructor() {
  }
  async exec(condition, callback) {
    if (condition()) {
      if (this.mark == 'RETURN') {
        return 'RETURN'
      }
      if (this.mark == 'CONTINUE') {
        return this.exec(condition, callback)
      }
      if (this.mark == 'BREAK') {
        return 'BREAK'
      }
      await callback(this.command.bind(this))
      return await this.exec(condition, callback)
    } else {
      return 'END'
    }
  }
  command(type: string) {
    this.mark = type
  }
}

export default async function whileAsync(condition, callback) {
  return new FakeWhile().exec(condition, callback)
}
