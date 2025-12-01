/**
 * 05-generator-examples.js
 * 제너레이터 예제
 *
 * 제너레이터를 사용하여 반복자를 쉽게 구현하고,
 * 양방향 통신, 위임 등 고급 기능을 살펴봅니다.
 */

// ============================================
// 1. 기본 제너레이터
// ============================================

console.log('=== 1. 기본 제너레이터 ===\n')

function* simpleGenerator() {
  yield 'a'
  yield 'b'
  yield 'c'
}

const gen = simpleGenerator()
console.log('gen.next():', gen.next())  // { value: 'a', done: false }
console.log('gen.next():', gen.next())  // { value: 'b', done: false }
console.log('gen.next():', gen.next())  // { value: 'c', done: false }
console.log('gen.next():', gen.next())  // { value: undefined, done: true }

console.log('\nfor...of 사용:', [...simpleGenerator()])
console.log()

// ============================================
// 2. 제너레이터로 이터러블 구현
// ============================================

console.log('=== 2. 제너레이터로 이터러블 구현 ===\n')

class Matrix {
  constructor(data) {
    this.data = data
  }

  // 제너레이터로 간단하게 구현
  *[Symbol.iterator]() {
    for (const row of this.data) {
      for (const cell of row) {
        yield cell
      }
    }
  }
}

const matrix = new Matrix([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
])

console.log('행렬 순회:', [...matrix])
console.log()

// ============================================
// 3. 무한 제너레이터
// ============================================

console.log('=== 3. 무한 제너레이터 ===\n')

function* fibonacci() {
  let prev = 0
  let curr = 1

  while (true) {
    yield curr
    ;[prev, curr] = [curr, prev + curr]
  }
}

function* take(iterable, n) {
  let count = 0
  for (const item of iterable) {
    if (count++ >= n) return
    yield item
  }
}

console.log('피보나치 처음 10개:', [...take(fibonacci(), 10)])
console.log()

// ============================================
// 4. 양방향 통신
// ============================================

console.log('=== 4. 양방향 통신 ===\n')

function* twoWay() {
  const first = yield 'First yield'
  console.log(`  받은 값: ${first}`)

  const second = yield 'Second yield'
  console.log(`  받은 값: ${second}`)

  return 'Done'
}

const twoWayGen = twoWay()

// 첫 번째 next()는 첫 yield까지 실행
console.log('1st next():', twoWayGen.next())

// 두 번째 next()에 값 전달 → first 변수에 할당
console.log('2nd next("Hello"):', twoWayGen.next('Hello'))

// 세 번째 next()에 값 전달 → second 변수에 할당
console.log('3rd next("World"):', twoWayGen.next('World'))
console.log()

// ============================================
// 5. 제너레이터 위임 (yield*)
// ============================================

console.log('=== 5. 제너레이터 위임 (yield*) ===\n')

function* numbers() {
  yield 1
  yield 2
  yield 3
}

function* letters() {
  yield 'a'
  yield 'b'
  yield 'c'
}

function* combined() {
  yield* numbers()  // numbers() 제너레이터에 위임
  yield 'middle'
  yield* letters()  // letters() 제너레이터에 위임
}

console.log('위임된 제너레이터:', [...combined()])
console.log()

// ============================================
// 6. 제너레이터로 트리 순회
// ============================================

console.log('=== 6. 제너레이터로 트리 순회 ===\n')

class TreeNode {
  constructor(value, children = []) {
    this.value = value
    this.children = children
  }

  // 깊이 우선 순회
  *[Symbol.iterator]() {
    yield this.value
    for (const child of this.children) {
      yield* child  // 자식 노드에 위임
    }
  }
}

const tree = new TreeNode('root', [
  new TreeNode('branch1', [
    new TreeNode('leaf1'),
    new TreeNode('leaf2')
  ]),
  new TreeNode('branch2', [
    new TreeNode('leaf3')
  ])
])

console.log('트리 순회:', [...tree])
console.log()

// ============================================
// 7. 제너레이터로 range 함수 구현
// ============================================

console.log('=== 7. range 함수 구현 ===\n')

function* range(start, end, step = 1) {
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      yield i
    }
  } else {
    for (let i = start; i > end; i += step) {
      yield i
    }
  }
}

console.log('range(0, 5):', [...range(0, 5)])
console.log('range(0, 10, 2):', [...range(0, 10, 2)])
console.log('range(10, 0, -1):', [...range(10, 0, -1)])
console.log('range(10, 0, -2):', [...range(10, 0, -2)])

console.log('\n=== 제너레이터 테스트 완료 ===')
