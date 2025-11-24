export class Queue {
  constructor (executor) {
    const queue = []
    const pendingResolves = []

    const enqueue = (item) => {
      if (pendingResolves.length > 0) {
        const resolve = pendingResolves.shift()
        resolve(item)
      } else {
        queue.push(item)
      }
    }

    executor(enqueue)

    this.dequeue = () => {
      return new Promise((resolve) => {
        if (queue.length > 0) {
          resolve(queue.shift())
        } else {
          pendingResolves.push(resolve)
        }
      })
    }
  }
}
