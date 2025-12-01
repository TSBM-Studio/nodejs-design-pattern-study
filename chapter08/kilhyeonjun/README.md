# Chapter 8: 구조적 설계 패턴

> **발표자**: 길현준
> **발표일**: 2025-12-01
> **주제**: 프록시, 데코레이터, 어댑터 패턴을 활용한 구조적 설계

---

## 📌 목차

1. [개요](#개요)
2. [프록시 (Proxy)](#1-프록시-proxy)
3. [데코레이터 (Decorator)](#2-데코레이터-decorator)
4. [프록시와 데코레이터의 경계](#3-프록시와-데코레이터의-경계)
5. [어댑터 (Adapter)](#4-어댑터-adapter)
6. [요약](#요약)
7. [연습문제](#연습문제)

---

## 개요

### 왜 이 챕터가 중요한가?

구조적 디자인 패턴은 **엔터티 간의 관계**를 실현하는 방법을 제공합니다. 이 패턴들은 소프트웨어 공학에서 가장 널리 사용되는 패턴들이며, Node.js 애플리케이션을 더 유연하고 확장 가능하게 만드는 데 필수적입니다.

### 핵심 키워드

- **프록시(Proxy)**: 다른 객체에 대한 액세스를 제어하는 패턴
- **데코레이터(Decorator)**: 기존 객체의 동작을 동적으로 증강시키는 패턴
- **어댑터(Adapter)**: 다른 인터페이스를 사용하여 객체의 기능에 액세스하는 패턴

### 세 패턴의 관계

| 패턴 | 목적 | 인터페이스 |
|------|------|-----------|
| **프록시** | 기존 동작을 **제어/보완** | 동일 |
| **데코레이터** | 새로운 기능을 **추가** | 확장 |
| **어댑터** | 인터페이스를 **변환** | 변경 |

---

## 1. 프록시 (Proxy)

프록시는 **Subject**라고 하는 다른 객체에 대한 액세스를 제어하는 객체입니다. 프록시와 Subject는 동일한 인터페이스를 가지며, 이를 통해 **투명하게** 하나를 다른 것으로 바꿀 수 있습니다.

### 1-1. 프록시의 활용 사례

프록시는 다음과 같은 상황에서 유용합니다:

| 사용 사례 | 설명 |
|----------|------|
| **데이터 검증** | 입력을 Subject에 전달하기 전에 유효성 검사 |
| **보안** | 클라이언트의 권한을 확인 후 요청 전달 |
| **캐싱** | 내부 캐시를 유지하여 중복 작업 방지 |
| **지연 초기화** | 실제로 필요할 때까지 객체 생성 지연 |
| **로깅** | 메서드 호출과 매개변수를 기록 |
| **원격 객체** | 원격 객체를 로컬처럼 표시 |

### 1-2. 프록시 구현 기술

#### 예제: StackCalculator

```javascript
class StackCalculator {
  constructor() {
    this.stack = []
  }

  putValue(value) {
    this.stack.push(value)
  }

  getValue() {
    return this.stack.pop()
  }

  peekValue() {
    return this.stack[this.stack.length - 1]
  }

  clear() {
    this.stack = []
  }

  divide() {
    const divisor = this.getValue()
    const dividend = this.getValue()
    const result = dividend / divisor
    this.putValue(result)
    return result
  }

  multiply() {
    const multiplicand = this.getValue()
    const multiplier = this.getValue()
    const result = multiplier * multiplicand
    this.putValue(result)
    return result
  }
}
```

> **재미있는 사실**: JavaScript에서 0으로 나누면 `Infinity`가 반환됩니다. 다른 언어에서는 보통 런타임 에러가 발생합니다.

#### 방법 1: 객체 컴포지션

기능을 확장하기 위해 객체를 다른 객체와 결합하는 기술입니다.

```javascript
class SafeCalculator {
  constructor(calculator) {
    this.calculator = calculator
  }

  // 프록시된 함수
  divide() {
    const divisor = this.calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return this.calculator.divide()
  }

  // 위임된 함수들
  putValue(value) { return this.calculator.putValue(value) }
  getValue() { return this.calculator.getValue() }
  peekValue() { return this.calculator.peekValue() }
  clear() { return this.calculator.clear() }
  multiply() { return this.calculator.multiply() }
}
```

**장점**: Subject를 변경하지 않아 안전함
**단점**: 모든 함수를 수동으로 위임해야 함

#### 방법 2: 객체 확장 (몽키 패치)

Subject를 직접 수정하는 방법입니다.

```javascript
function patchToSafeCalculator(calculator) {
  const divideOrig = calculator.divide
  calculator.divide = () => {
    const divisor = calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return divideOrig.apply(calculator)
  }
  return calculator
}
```

**장점**: 위임 코드가 필요 없어 간단함
**단점**: Subject를 직접 변경하므로 부작용 발생 가능

> ⚠️ **주의**: Subject가 다른 코드와 공유되는 경우 반드시 피해야 합니다!

#### 방법 3: ES2015 Proxy 객체

JavaScript 언어에 내장된 강력한 프록시 생성 방법입니다.

```javascript
const safeCalculatorHandler = {
  get: (target, property) => {
    if (property === 'divide') {
      return function() {
        const divisor = target.peekValue()
        if (divisor === 0) {
          throw Error('Division by 0')
        }
        return target.divide()
      }
    }
    return target[property]
  }
}

const calculator = new StackCalculator()
const safeCalculator = new Proxy(calculator, safeCalculatorHandler)
```

**장점**:
- Subject를 변경하지 않음
- 명시적 위임 불필요
- 동적 속성 접근 가능

**단점**:
- 폴리필/트랜스파일 불가능 (이전 환경 지원 어려움)

#### Proxy 객체의 트랩 함수들

| 트랩 | 설명 |
|------|------|
| `get` | 속성 읽기를 가로챔 |
| `set` | 속성 쓰기를 가로챔 |
| `has` | `in` 연산자를 가로챔 |
| `delete` | 속성 삭제를 가로챔 |
| `apply` | 함수 호출을 가로챔 |
| `construct` | `new` 연산자를 가로챔 |

```javascript
// 가상 배열 예제: 모든 짝수를 포함하는 배열
const evenNumbers = new Proxy([], {
  get: (target, index) => index * 2,
  has: (target, number) => number % 2 === 0
})

console.log(2 in evenNumbers)  // true
console.log(5 in evenNumbers)  // false
console.log(evenNumbers[7])    // 14
```

### 1-3. 프록시 기술 비교

| 기술 | Subject 변경 | 위임 필요 | 동적 속성 | 추천 상황 |
|------|-------------|----------|----------|----------|
| **컴포지션** | ❌ | ✅ | ❌ | 안전성 중시, 지연 초기화 필요 |
| **객체 확장** | ✅ | ❌ | ❌ | 간단한 수정, 프라이빗 범위 |
| **Proxy 객체** | ❌ | ❌ | ✅ | 동적 접근 제어, 고급 기능 |

### 1-4. 실전 예제: 쓰기 가능한 로깅 스트림

```javascript
export function createLoggingWritable(writable) {
  return new Proxy(writable, {
    get(target, propKey, receiver) {
      if (propKey === 'write') {
        return function(...args) {
          const [chunk] = args
          console.log('Writing', chunk)
          return writable.write(...args)
        }
      }
      return target[propKey]
    }
  })
}
```

**사용 예시**:

```javascript
import { createWriteStream } from 'fs'
import { createLoggingWritable } from './logging-writable.js'

const writable = createWriteStream('test.txt')
const writableProxy = createLoggingWritable(writable)

writableProxy.write('First chunk')   // 콘솔에 "Writing First chunk" 출력
writableProxy.write('Second chunk')  // 콘솔에 "Writing Second chunk" 출력
writable.write('This is not logged') // 로깅 없음
writableProxy.end()
```

### 1-5. 변경 옵저버 패턴

객체의 상태 변경을 감지하고 옵저버에게 알리는 패턴입니다. 반응형 프로그래밍(Reactive Programming)의 초석이 됩니다.

```javascript
export function createObservable(target, observer) {
  const observable = new Proxy(target, {
    set(obj, prop, value) {
      if (value !== obj[prop]) {
        const prev = obj[prop]
        obj[prop] = value
        observer({ prop, prev, curr: value })
      }
      return true
    }
  })
  return observable
}
```

**사용 예시: 송장 자동 계산**

```javascript
import { createObservable } from './create-observable.js'

function calculateTotal(invoice) {
  return invoice.subtotal - invoice.discount + invoice.tax
}

const invoice = { subtotal: 100, discount: 10, tax: 20 }
let total = calculateTotal(invoice)

const obsInvoice = createObservable(
  invoice,
  ({ prop, prev, curr }) => {
    total = calculateTotal(invoice)
    console.log(`TOTAL: ${total} (${prop}: ${prev} -> ${curr})`)
  }
)

obsInvoice.subtotal = 200  // TOTAL: 210 (subtotal: 100 -> 200)
obsInvoice.discount = 20   // TOTAL: 200 (discount: 10 -> 20)
obsInvoice.discount = 20   // 변경 없음 - 알림 없음
obsInvoice.tax = 30        // TOTAL: 210 (tax: 20 -> 30)
```

### 1-6. 실전에서

- **LoopBack**: 컨트롤러 함수 호출을 가로채어 유효성 검사/인증 수행
- **Vue.js 3**: Proxy 객체로 반응형 속성 구현
- **MobX**: Proxy 객체로 반응형 상태 관리

---

## 2. 데코레이터 (Decorator)

데코레이터는 기존 객체의 동작을 **동적으로 증강**시키는 패턴입니다. 클래스 상속과 달리, **명시적으로 데코레이팅된 인스턴스에만** 새로운 동작이 추가됩니다.

### 2-1. 프록시 vs 데코레이터

| 구분 | 프록시 | 데코레이터 |
|------|--------|-----------|
| **목적** | 기존 인터페이스 동작을 **수정** | 새로운 기능을 **추가** |
| **인터페이스** | 동일 유지 | 확장됨 |

### 2-2. 데코레이터 구현 기법

프록시와 동일한 구현 기술을 사용합니다.

#### 방법 1: 컴포지션

```javascript
class EnhancedCalculator {
  constructor(calculator) {
    this.calculator = calculator
  }

  // 새로운 함수
  add() {
    const addend2 = this.getValue()
    const addend1 = this.getValue()
    const result = addend1 + addend2
    this.putValue(result)
    return result
  }

  // 수정된 함수 (0으로 나누기 방지)
  divide() {
    const divisor = this.calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return this.calculator.divide()
  }

  // 위임된 함수들
  putValue(value) { return this.calculator.putValue(value) }
  getValue() { return this.calculator.getValue() }
  peekValue() { return this.calculator.peekValue() }
  clear() { return this.calculator.clear() }
  multiply() { return this.calculator.multiply() }
}
```

#### 방법 2: 객체 확장

```javascript
function patchCalculator(calculator) {
  // 새로운 함수 추가
  calculator.add = function() {
    const addend2 = calculator.getValue()
    const addend1 = calculator.getValue()
    const result = addend1 + addend2
    calculator.putValue(result)
    return result
  }

  // 기존 함수 수정
  const divideOrig = calculator.divide
  calculator.divide = () => {
    const divisor = calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return divideOrig.apply(calculator)
  }

  return calculator
}
```

#### 방법 3: Proxy 객체

```javascript
const enhancedCalculatorHandler = {
  get(target, property) {
    if (property === 'add') {
      return function add() {
        const addend2 = target.getValue()
        const addend1 = target.getValue()
        const result = addend1 + addend2
        target.putValue(result)
        return result
      }
    } else if (property === 'divide') {
      return function() {
        const divisor = target.peekValue()
        if (divisor === 0) {
          throw Error('Division by 0')
        }
        return target.divide()
      }
    }
    return target[property]
  }
}
```

### 2-3. 실전 예제: LevelUP 플러그인

#### LevelUP 소개

LevelUP은 Google의 LevelDB를 감싼 Node.js 래퍼입니다. **"데이터베이스의 Node.js"**라고 불리며, 최소주의와 확장성이 특징입니다.

- 메모리, Redis, IndexedDB 등 다양한 백엔드 지원
- 복제, 보조 인덱스, 쿼리 엔진 등 플러그인 생태계

#### 플러그인 구현

특정 패턴의 객체가 저장될 때 알림을 받는 플러그인:

```javascript
// level-subscribe.js
export function levelSubscribe(db) {
  db.subscribe = (pattern, listener) => {
    db.on('put', (key, val) => {
      const match = Object.keys(pattern).every(
        k => (pattern[k] === val[k])
      )
      if (match) {
        listener(key, val)
      }
    })
  }
  return db
}
```

**사용 예시**:

```javascript
import level from 'level'
import { levelSubscribe } from './level-subscribe.js'

const db = level('./db', { valueEncoding: 'json' })
levelSubscribe(db)  // 데코레이트!

db.subscribe(
  { doctype: 'tweet', language: 'en' },
  (k, val) => console.log(val)
)

db.put('1', {
  doctype: 'tweet',
  text: 'Hi',
  language: 'en'
})  // 출력됨!

db.put('2', {
  doctype: 'company',
  name: 'ACME Co.'
})  // 출력 안됨 (패턴 불일치)
```

### 2-4. 실전에서

- **level-inverted-index**: 텍스트 검색을 위한 역 인덱스
- **levelplus**: 원자적 업데이트 추가
- **json-socket**: TCP 소켓을 통한 JSON 데이터 전송
- **fastify**: 서버 인스턴스에 기능/설정 추가 (decorate API)

---

## 3. 프록시와 데코레이터의 경계

JavaScript에서는 두 패턴의 경계가 매우 모호합니다.

### 고전적 정의

| 패턴 | 정의 |
|------|------|
| **데코레이터** | 새로운 동작을 기존 객체에 **추가** |
| **프록시** | 객체에 대한 **접근을 제어** |

### 실제 차이점

- **데코레이터**: 다양한 객체를 감싸 추가 기능 부여 (래퍼)
- **프록시**: 원래 인터페이스를 변경하지 않고 접근 제어

### Node.js에서의 관점

> JavaScript와 Node.js를 다룰 때 중요한 점은 이 두 패턴의 명명법과 표준적인 정의에 **얽매이지 않아야** 한다는 것입니다.

두 패턴을 **상호 보완적**이며 때로는 **상호 교환 가능**한 도구로 다루는 것이 좋습니다.

---

## 4. 어댑터 (Adapter)

어댑터 패턴은 객체의 인터페이스를 **다른 인터페이스로 변환**하여 호환성을 제공합니다.

### 4-1. 어댑터란?

**실제 예시**: USB Type-A 케이블을 USB Type-C 포트에 연결하는 장치

소프트웨어에서 어댑터는 객체의 인터페이스를 가져와서 **클라이언트가 예상하는 다른 인터페이스**와 호환되도록 합니다.

### 4-2. 실전 예제: LevelUP을 fs API로 사용

fs 모듈의 `readFile()`과 `writeFile()` 호출을 LevelUP의 `db.get()`과 `db.put()`으로 변환:

```javascript
// fs-adapter.js
import { resolve } from 'path'

export function createFSAdapter(db) {
  return ({
    readFile(filename, options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      } else if (typeof options === 'string') {
        options = { encoding: options }
      }

      db.get(resolve(filename), {
        valueEncoding: options.encoding
      }, (err, value) => {
        if (err) {
          if (err.type === 'NotFoundError') {
            err = new Error(`ENOENT, open '${filename}'`)
            err.code = 'ENOENT'
            err.errno = 34
            err.path = filename
          }
          return callback && callback(err)
        }
        callback && callback(null, value)
      })
    },

    writeFile(filename, contents, options, callback) {
      if (typeof options === 'function') {
        callback = options
        options = {}
      } else if (typeof options === 'string') {
        options = { encoding: options }
      }

      db.put(resolve(filename), contents, {
        valueEncoding: options.encoding
      }, callback)
    }
  })
}
```

**사용 예시**:

```javascript
import level from 'level'
import { createFSAdapter } from './fs-adapter.js'

const db = level('./db', { valueEncoding: 'binary' })
const fs = createFSAdapter(db)

fs.writeFile('file.txt', 'Hello!', () => {
  fs.readFile('file.txt', { encoding: 'utf8' }, (err, res) => {
    console.log(res)  // "Hello!"
  })
})
```

> **활용 포인트**: level-js를 사용하면 동일한 코드를 브라우저에서도 실행할 수 있습니다!

### 4-3. 실전에서

- **LevelUP 스토리지 어댑터**: LevelDB, IndexedDB, Redis 등 다양한 백엔드
- **JugglingDB**: 다중 데이터베이스 ORM의 어댑터들
- **nanoSQL**: 다양한 데이터베이스 지원
- **level-filesystem**: LevelUP 위에 완전한 fs API 구현

---

## 요약

| 패턴 | 목적 | 인터페이스 | 주요 활용 |
|------|------|-----------|----------|
| **프록시** | 접근 제어, 동작 보완 | 동일 | 캐싱, 지연 초기화, 로깅, 검증 |
| **데코레이터** | 새 기능 추가 | 확장 | 플러그인, 기능 증강 |
| **어댑터** | 인터페이스 변환 | 변경 | 호환성, 크로스 플랫폼 |

### 구현 기술 비교

| 기술 | 장점 | 단점 |
|------|------|------|
| **컴포지션** | 안전, Subject 보존 | 모든 함수 위임 필요 |
| **객체 확장** | 간단, 위임 불필요 | Subject 변경, 부작용 위험 |
| **Proxy 객체** | 강력, 동적 제어 | 이전 환경 미지원 |

---

## 연습문제

책의 연습문제 (p334-335)에 대한 풀이는 `code/exercises/` 디렉토리에서 확인할 수 있습니다.

### 8.1 HTTP 클라이언트 캐시
HTTP 요청의 응답을 캐시하는 프록시를 작성합니다.

### 8.2 로그의 타임스탬프 찍기
console 객체에 현재 타임스탬프를 추가하는 프록시를 만듭니다.

### 8.3 컬러 콘솔 출력
`red()`, `yellow()`, `green()` 함수를 추가하는 콘솔 데코레이터를 작성합니다.

### 8.4 가상 파일 시스템
메모리에 데이터를 저장하는 fs 어댑터를 구현합니다.

### 8.5 지연 버퍼
`write()`가 처음 호출될 때만 Buffer를 생성하는 가상 프록시를 만듭니다.

---

## 참고 자료

- [MDN Proxy](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
- [LevelUP](https://github.com/Level/levelup)
- [The Reactive Manifesto](https://www.reactivemanifesto.org/)
- [Awesome Level](https://github.com/Level/awesome)
