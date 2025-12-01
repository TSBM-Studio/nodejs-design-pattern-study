/**
 * Chapter 8: 구조적 설계 패턴 - 연습문제
 * 8.5 지연 버퍼 (Lazy Buffer)
 *
 * 지정된 크기의 버퍼에 대한 가상 프록시를 생성합니다.
 * write()가 처음 호출될 때만 Buffer 객체를 인스턴스화하여
 * 메모리를 효율적으로 사용합니다.
 *
 * 이것은 "지연 초기화(Lazy Initialization)" 프록시 패턴의 예입니다.
 */

/**
 * 지연 버퍼 팩토리
 * @param {number} size - 버퍼 크기
 * @returns {Proxy} Buffer 프록시
 */
export function createLazyBuffer(size) {
  // 실제 버퍼 (아직 생성되지 않음)
  let buffer = null
  let initialized = false

  // 버퍼 초기화 함수
  function initializeBuffer() {
    if (!initialized) {
      console.log(`[LazyBuffer] Allocating ${size} bytes...`)
      buffer = Buffer.alloc(size)
      initialized = true
    }
    return buffer
  }

  // 쓰기 작업 목록 (버퍼를 수정하는 메서드들)
  const writeMethods = [
    'write', 'writeInt8', 'writeInt16LE', 'writeInt16BE',
    'writeInt32LE', 'writeInt32BE', 'writeUInt8', 'writeUInt16LE',
    'writeUInt16BE', 'writeUInt32LE', 'writeUInt32BE', 'writeFloatLE',
    'writeFloatBE', 'writeDoubleLE', 'writeDoubleBE', 'writeBigInt64LE',
    'writeBigInt64BE', 'writeBigUInt64LE', 'writeBigUInt64BE',
    'fill', 'set', 'copy', 'swap16', 'swap32', 'swap64'
  ]

  // 가상 타겟 객체 (빈 객체)
  const target = {}

  return new Proxy(target, {
    get(_, property) {
      // 특수 속성
      if (property === 'isInitialized') {
        return initialized
      }
      if (property === 'lazySize') {
        return size
      }
      if (property === 'forceInitialize') {
        return () => initializeBuffer()
      }

      // length 속성 (초기화 없이 반환)
      if (property === 'length') {
        return size
      }

      // 쓰기 메서드 - 초기화 후 실행
      if (writeMethods.includes(property)) {
        return function (...args) {
          const buf = initializeBuffer()
          return buf[property](...args)
        }
      }

      // 읽기 메서드 - 초기화되지 않았으면 에러
      if (typeof Buffer.prototype[property] === 'function') {
        return function (...args) {
          if (!initialized) {
            throw new Error('Buffer has not been initialized. Write something first.')
          }
          return buffer[property](...args)
        }
      }

      // 인덱스 접근
      if (!isNaN(parseInt(property))) {
        if (!initialized) {
          return undefined
        }
        return buffer[property]
      }

      // 다른 속성
      if (initialized && property in buffer) {
        return buffer[property]
      }

      return undefined
    },

    set(_, property, value) {
      // 인덱스로 쓰기 시도 - 초기화 후 설정
      if (!isNaN(parseInt(property))) {
        const buf = initializeBuffer()
        buf[property] = value
        return true
      }
      return false
    },

    has(_, property) {
      if (property === 'isInitialized' || property === 'lazySize') {
        return true
      }
      return property in Buffer.prototype
    }
  })
}

/**
 * 고급 버전: 더 많은 기능을 가진 LazyBuffer 클래스
 */
export class LazyBuffer {
  #size
  #buffer
  #initialized

  constructor(size) {
    this.#size = size
    this.#buffer = null
    this.#initialized = false
  }

  #initialize() {
    if (!this.#initialized) {
      console.log(`[LazyBuffer] Allocating ${this.#size} bytes...`)
      this.#buffer = Buffer.alloc(this.#size)
      this.#initialized = true
    }
    return this.#buffer
  }

  get length() {
    return this.#size
  }

  get isInitialized() {
    return this.#initialized
  }

  // 쓰기 메서드들
  write(string, offset, length, encoding) {
    return this.#initialize().write(string, offset, length, encoding)
  }

  writeInt8(value, offset) {
    return this.#initialize().writeInt8(value, offset)
  }

  writeInt32LE(value, offset) {
    return this.#initialize().writeInt32LE(value, offset)
  }

  writeUInt8(value, offset) {
    return this.#initialize().writeUInt8(value, offset)
  }

  fill(value, offset, end, encoding) {
    return this.#initialize().fill(value, offset, end, encoding)
  }

  // 읽기 메서드들 (초기화 확인)
  #ensureInitialized() {
    if (!this.#initialized) {
      throw new Error('Buffer has not been initialized. Write something first.')
    }
    return this.#buffer
  }

  readInt8(offset) {
    return this.#ensureInitialized().readInt8(offset)
  }

  readInt32LE(offset) {
    return this.#ensureInitialized().readInt32LE(offset)
  }

  readUInt8(offset) {
    return this.#ensureInitialized().readUInt8(offset)
  }

  toString(encoding, start, end) {
    return this.#ensureInitialized().toString(encoding, start, end)
  }

  toJSON() {
    if (!this.#initialized) {
      return { type: 'LazyBuffer', size: this.#size, initialized: false }
    }
    return this.#buffer.toJSON()
  }

  // 명시적 초기화
  forceInitialize() {
    return this.#initialize()
  }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 지연 버퍼 프록시 테스트 ===\n')

  // Proxy 버전 테스트
  console.log('--- Proxy 버전 ---')
  const lazyBuf1 = createLazyBuffer(1024)

  console.log('length:', lazyBuf1.length)           // 1024 (초기화 없이)
  console.log('isInitialized:', lazyBuf1.isInitialized)  // false

  // 읽기 시도 - 에러 발생
  console.log('\n읽기 시도 (초기화 전):')
  try {
    lazyBuf1.toString()
  } catch (err) {
    console.log('에러:', err.message)
  }

  // 쓰기 시도 - 버퍼 초기화됨
  console.log('\n쓰기 시도:')
  lazyBuf1.write('Hello, Lazy Buffer!')
  console.log('isInitialized:', lazyBuf1.isInitialized)  // true

  // 이제 읽기 가능
  console.log('\n읽기 (초기화 후):')
  console.log('내용:', lazyBuf1.toString('utf8', 0, 19))

  // 클래스 버전 테스트
  console.log('\n--- 클래스 버전 ---')
  const lazyBuf2 = new LazyBuffer(512)

  console.log('length:', lazyBuf2.length)           // 512
  console.log('isInitialized:', lazyBuf2.isInitialized)  // false

  // 쓰기
  console.log('\n쓰기 시도:')
  lazyBuf2.writeInt32LE(12345, 0)
  console.log('isInitialized:', lazyBuf2.isInitialized)  // true

  // 읽기
  console.log('읽은 값:', lazyBuf2.readInt32LE(0))  // 12345

  // fill 테스트
  console.log('\n--- fill 테스트 ---')
  const lazyBuf3 = createLazyBuffer(10)
  console.log('초기화 전 length:', lazyBuf3.length)

  lazyBuf3.fill(65)  // 'A'의 ASCII 코드
  console.log('fill 후 내용:', lazyBuf3.toString())  // "AAAAAAAAAA"

  // 초기화하지 않은 버퍼
  console.log('\n--- 초기화하지 않은 버퍼 ---')
  const lazyBuf4 = createLazyBuffer(1000000)  // 1MB
  console.log('1MB 버퍼 생성 (초기화 안됨)')
  console.log('isInitialized:', lazyBuf4.isInitialized)  // false
  console.log('메모리 할당 없이 length 접근 가능:', lazyBuf4.length)  // 1000000
  // 버퍼를 사용하지 않으면 실제로 1MB가 할당되지 않습니다!
}
