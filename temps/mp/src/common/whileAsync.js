class FakeWhile {
  constructor() {
    this.mark = 'RUNNING'
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
  command(type) {
    this.mark = type
  }
}

// 模拟实现 while 循环，支持 await 操作，函数集合 action 
export default async function whileAsync(condition, callback) {
  return new FakeWhile().exec(condition, callback)
}
