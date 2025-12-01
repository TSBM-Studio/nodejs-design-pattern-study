/**
 * 연습문제 9.5: 비동기 대기열 반복자
 *
 * Symbol.asyncIterator를 구현하여 비동기 대기열(AsyncQueue)을
 * for await...of로 순회할 수 있게 합니다.
 *
 * 기능:
 * - enqueue(): 아이템 추가
 * - dequeue(): 아이템 제거 (비동기, 아이템이 있을 때까지 대기)
 * - close(): 대기열 종료
 * - for await...of 지원
 */

// ============================================
// AsyncQueue 클래스
// ============================================

class AsyncQueue {
  constructor() {
    this.queue = []
    this.resolvers = []  // 대기 중인 Promise resolver들
    this.closed = false
  }

  /**
   * 아이템 추가
   */
  enqueue(item) {
    if (this.closed) {
      throw new Error('Queue is closed')
    }

    // 대기 중인 소비자가 있으면 바로 전달
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()
      resolve({ value: item, done: false })
    } else {
      // 대기 중인 소비자가 없으면 큐에 저장
      this.queue.push(item)
    }
  }

  /**
   * 아이템 제거 (비동기)
   * 아이템이 있을 때까지 대기
   */
  dequeue() {
    return new Promise((resolve) => {
      // 큐에 아이템이 있으면 바로 반환
      if (this.queue.length > 0) {
        resolve({ value: this.queue.shift(), done: false })
      }
      // 큐가 닫혔으면 done 반환
      else if (this.closed) {
        resolve({ value: undefined, done: true })
      }
      // 아이템이 없으면 대기
      else {
        this.resolvers.push(resolve)
      }
    })
  }

  /**
   * 대기열 종료
   */
  close() {
    this.closed = true

    // 대기 중인 모든 소비자에게 done 신호 전달
    while (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()
      resolve({ value: undefined, done: true })
    }
  }

  /**
   * 남은 아이템 수
   */
  get size() {
    return this.queue.length
  }

  /**
   * 대기 중인 소비자 수
   */
  get pendingCount() {
    return this.resolvers.length
  }

  /**
   * 비동기 이터러블 프로토콜 구현
   */
  [Symbol.asyncIterator]() {
    return {
      next: () => this.dequeue()
    }
  }
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== 연습문제 9.5: 비동기 대기열 반복자 ===\n')

  // 1. 기본 사용법 테스트
  console.log('--- 1. 기본 enqueue/dequeue ---')
  const queue1 = new AsyncQueue()

  queue1.enqueue('첫 번째')
  queue1.enqueue('두 번째')
  queue1.enqueue('세 번째')

  console.log('큐 크기:', queue1.size)
  console.log('dequeue:', (await queue1.dequeue()).value)
  console.log('dequeue:', (await queue1.dequeue()).value)
  console.log('큐 크기:', queue1.size)
  console.log()

  // 2. for await...of 테스트
  console.log('--- 2. for await...of 순회 ---')
  const queue2 = new AsyncQueue()

  // 비동기로 아이템 추가
  setTimeout(() => queue2.enqueue('A'), 100)
  setTimeout(() => queue2.enqueue('B'), 200)
  setTimeout(() => queue2.enqueue('C'), 300)
  setTimeout(() => queue2.close(), 400)  // 순회 종료

  console.log('순회 시작...')
  for await (const item of queue2) {
    console.log(`  받은 아이템: ${item}`)
  }
  console.log('순회 완료')
  console.log()

  // 3. 생산자-소비자 패턴
  console.log('--- 3. 생산자-소비자 패턴 ---')
  const queue3 = new AsyncQueue()

  // 생산자: 1초 동안 100ms마다 아이템 추가
  const producer = async () => {
    for (let i = 1; i <= 5; i++) {
      await new Promise(r => setTimeout(r, 100))
      console.log(`  [생산] 아이템 ${i}`)
      queue3.enqueue(i)
    }
    await new Promise(r => setTimeout(r, 100))
    queue3.close()
    console.log('  [생산] 종료')
  }

  // 소비자: 아이템이 올 때마다 처리
  const consumer = async () => {
    for await (const item of queue3) {
      console.log(`  [소비] 아이템 ${item} 처리`)
      // 처리 시간 시뮬레이션
      await new Promise(r => setTimeout(r, 50))
    }
    console.log('  [소비] 종료')
  }

  // 동시 실행
  await Promise.all([producer(), consumer()])
  console.log()

  // 4. 대기 중인 소비자 테스트
  console.log('--- 4. 대기 중인 소비자 ---')
  const queue4 = new AsyncQueue()

  // 먼저 소비자 대기 시작
  const promise1 = queue4.dequeue()
  const promise2 = queue4.dequeue()
  console.log(`대기 중인 소비자: ${queue4.pendingCount}`)

  // 나중에 아이템 추가
  queue4.enqueue('지연된 아이템 1')
  queue4.enqueue('지연된 아이템 2')

  const result1 = await promise1
  const result2 = await promise2
  console.log(`받은 값 1: ${result1.value}`)
  console.log(`받은 값 2: ${result2.value}`)
  console.log(`대기 중인 소비자: ${queue4.pendingCount}`)
  console.log()

  // 5. 닫힌 큐에서 dequeue
  console.log('--- 5. 닫힌 큐 테스트 ---')
  const queue5 = new AsyncQueue()
  queue5.enqueue('마지막 아이템')
  queue5.close()

  const r1 = await queue5.dequeue()
  console.log(`결과 1: value=${r1.value}, done=${r1.done}`)

  const r2 = await queue5.dequeue()
  console.log(`결과 2: value=${r2.value}, done=${r2.done}`)

  // 닫힌 큐에 enqueue 시도
  try {
    queue5.enqueue('에러 발생')
  } catch (e) {
    console.log(`에러: ${e.message}`)
  }

  console.log('\n=== 연습문제 9.5 완료 ===')
}

main().catch(console.error)
