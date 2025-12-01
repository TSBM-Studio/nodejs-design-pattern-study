/**
 * 04-iterator-basics.js
 * 반복자 패턴 - 기본 개념
 *
 * JavaScript의 반복자(Iterator)와 이터러블(Iterable) 프로토콜을
 * 이해하고 직접 구현합니다.
 */

// ============================================
// 1. 반복자 프로토콜 기본
// ============================================

console.log('=== 1. 반복자 프로토콜 기본 ===\n')

/**
 * next() 메서드를 가진 객체가 반복자입니다.
 * next()는 { value, done } 형태의 객체를 반환합니다.
 */
const simpleIterator = {
  values: ['a', 'b', 'c'],
  index: 0,
  next() {
    if (this.index < this.values.length) {
      return { value: this.values[this.index++], done: false }
    }
    return { value: undefined, done: true }
  }
}

console.log('simpleIterator.next():', simpleIterator.next())  // { value: 'a', done: false }
console.log('simpleIterator.next():', simpleIterator.next())  // { value: 'b', done: false }
console.log('simpleIterator.next():', simpleIterator.next())  // { value: 'c', done: false }
console.log('simpleIterator.next():', simpleIterator.next())  // { value: undefined, done: true }
console.log()

// ============================================
// 2. 이터러블 프로토콜
// ============================================

console.log('=== 2. 이터러블 프로토콜 ===\n')

/**
 * Symbol.iterator 메서드를 구현하면 이터러블이 됩니다.
 * for...of 문에서 사용할 수 있습니다.
 */
class Alphabet {
  constructor(start = 'a', end = 'z') {
    this.start = start.charCodeAt(0)
    this.end = end.charCodeAt(0)
  }

  // 이터러블 프로토콜 구현
  [Symbol.iterator]() {
    let current = this.start
    const end = this.end

    return {
      next() {
        if (current <= end) {
          return { value: String.fromCharCode(current++), done: false }
        }
        return { value: undefined, done: true }
      }
    }
  }
}

const abc = new Alphabet('a', 'e')
console.log('for...of 로 순회:')
for (const letter of abc) {
  console.log(`  ${letter}`)
}

// 스프레드 연산자 사용
console.log('\n스프레드 연산자:', [...new Alphabet('x', 'z')])

// Array.from 사용
console.log('Array.from:', Array.from(new Alphabet('1', '5')))
console.log()

// ============================================
// 3. 2차원 행렬 반복자
// ============================================

console.log('=== 3. 2차원 행렬 반복자 ===\n')

class Matrix {
  constructor(data) {
    this.data = data
  }

  get(row, col) {
    return this.data[row][col]
  }

  // 행 우선 순회
  [Symbol.iterator]() {
    const data = this.data
    let row = 0
    let col = 0

    return {
      next() {
        if (row >= data.length) {
          return { value: undefined, done: true }
        }

        const value = data[row][col]

        col++
        if (col >= data[row].length) {
          col = 0
          row++
        }

        return { value, done: false }
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
// 4. 무한 반복자
// ============================================

console.log('=== 4. 무한 반복자 ===\n')

/**
 * 피보나치 수열 무한 반복자
 */
class Fibonacci {
  [Symbol.iterator]() {
    let prev = 0
    let curr = 1

    return {
      next() {
        const value = curr
        ;[prev, curr] = [curr, prev + curr]
        return { value, done: false }  // 절대 끝나지 않음
      }
    }
  }
}

const fib = new Fibonacci()
const fibIterator = fib[Symbol.iterator]()

console.log('피보나치 수열 (처음 10개):')
const fibNumbers = []
for (let i = 0; i < 10; i++) {
  fibNumbers.push(fibIterator.next().value)
}
console.log(fibNumbers)
console.log()

// ============================================
// 5. 내장 이터러블
// ============================================

console.log('=== 5. 내장 이터러블 ===\n')

// 배열
const arr = [1, 2, 3]
console.log('배열:', [...arr])

// 문자열
const str = 'Hello'
console.log('문자열:', [...str])

// Map
const map = new Map([['a', 1], ['b', 2]])
console.log('Map:', [...map])
console.log('Map.keys():', [...map.keys()])
console.log('Map.values():', [...map.values()])
console.log('Map.entries():', [...map.entries()])

// Set
const set = new Set([1, 2, 3, 2, 1])
console.log('Set:', [...set])

console.log('\n=== 반복자 기본 테스트 완료 ===')
