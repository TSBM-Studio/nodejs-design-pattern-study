# Chapter 9: 행위 디자인 패턴

> **발표자**: 길현준
> **발표일**: 2025-12-01
> **주제**: 전략, 상태, 템플릿, 반복자, 미들웨어, 명령 패턴을 활용한 행위적 설계

---

## 📌 목차

1. [개요](#개요)
2. [전략 (Strategy)](#1-전략-strategy)
3. [상태 (State)](#2-상태-state)
4. [템플릿 (Template)](#3-템플릿-template)
5. [반복자 (Iterator)](#4-반복자-iterator)
6. [미들웨어 (Middleware)](#5-미들웨어-middleware)
7. [명령 (Command)](#6-명령-command)
8. [요약](#요약)
9. [연습문제](#연습문제)

---

## 개요

### 왜 이 챕터가 중요한가?

행위 디자인 패턴은 **객체 간의 상호작용과 동작 방식**을 정의합니다. 이 패턴들은 컴포넌트들이 어떻게 결합하고 상호작용해야 하는지를 정의하여, 확장 가능하고 모듈화되며 재사용 가능한 소프트웨어를 만드는 데 도움이 됩니다.

### 핵심 키워드

- **전략(Strategy)**: 런타임에 알고리즘을 교체할 수 있는 패턴
- **상태(State)**: 객체 상태에 따라 동작을 변경하는 패턴
- **템플릿(Template)**: 알고리즘 구조를 재사용하고 일부만 구현하는 패턴
- **반복자(Iterator)**: 컬렉션 순회를 위한 공통 인터페이스 제공
- **미들웨어(Middleware)**: 모듈식 처리 파이프라인 정의
- **명령(Command)**: 실행 정보를 객체로 캡슐화하는 패턴

### 이미 본 행위 패턴

**옵저버(Observer)** 패턴은 3장에서 이미 다뤘습니다. Node.js의 이벤트 기반 아키텍처의 핵심이 되는 패턴입니다.

---

## 1. 전략 (Strategy)

### 1-1. 전략 패턴이란?

전략 패턴은 **컨텍스트**라는 객체가 **전략(Strategy)**이라는 별도의 상호 교환 가능한 객체로 로직의 변경을 지원합니다.

```
┌─────────────────┐      ┌─────────────────┐
│     Context     │ ──── │    Strategy     │
│                 │      ├─────────────────┤
│  - strategy     │      │  strategyA()    │
│  - operation()  │      │  strategyB()    │
└─────────────────┘      │  strategyC()    │
                         └─────────────────┘
```

**핵심 아이디어**: 자동차의 타이어를 생각해보면, 눈길에는 겨울용 타이어, 고속도로에는 고성능 타이어를 장착할 수 있습니다. 자동차 전체를 바꾸지 않고 타이어(전략)만 교체합니다.

### 1-2. 다중 형식 환경설정 예제

환경설정을 JSON, INI 등 다양한 형식으로 저장할 수 있는 Config 객체를 만들어봅시다.

**config.js - 컨텍스트**
```javascript
import { promises as fs } from 'fs'
import objectPath from 'object-path'

export class Config {
  constructor(formatStrategy) {
    this.data = {}
    this.formatStrategy = formatStrategy
  }

  get(configPath) {
    return objectPath.get(this.data, configPath)
  }

  set(configPath, value) {
    return objectPath.set(this.data, configPath, value)
  }

  async load(filePath) {
    console.log(`Deserializing from ${filePath}`)
    this.data = this.formatStrategy.deserialize(
      await fs.readFile(filePath, 'utf-8')
    )
  }

  async save(filePath) {
    console.log(`Serializing to ${filePath}`)
    await fs.writeFile(filePath,
      this.formatStrategy.serialize(this.data))
  }
}
```

**strategies.js - 전략들**
```javascript
import ini from 'ini'

// INI 형식 전략
export const iniStrategy = {
  deserialize: data => ini.parse(data),
  serialize: data => ini.stringify(data)
}

// JSON 형식 전략
export const jsonStrategy = {
  deserialize: data => JSON.parse(data),
  serialize: data => JSON.stringify(data, null, '  ')
}
```

**사용 예시**
```javascript
import { Config } from './config.js'
import { jsonStrategy, iniStrategy } from './strategies.js'

// INI 전략 사용
const iniConfig = new Config(iniStrategy)
await iniConfig.load('samples/conf.ini')

// JSON 전략 사용
const jsonConfig = new Config(jsonStrategy)
await jsonConfig.load('samples/conf.json')
```

### 1-3. 전략 선택 방법

- **생성자에서 주입**: 가장 일반적인 방법
- **동적 선택**: 파일 확장자에 따라 자동 선택
- **전략 분리**: 직렬화/역직렬화 전략을 별도로 지정

### 1-4. 실전에서

전략 패턴이 사용되는 대표적인 라이브러리:
- **Passport.js**: 인증 전략 (Local, OAuth, JWT 등)
- **multer**: 파일 저장 전략 (디스크, 메모리, S3 등)

---

## 2. 상태 (State)

### 2-1. 상태 패턴이란?

상태 패턴은 전략 패턴의 변형으로, **객체의 상태에 따라 다른 전략을 선택**합니다. 컨텍스트 객체가 상태에 따라 동작을 채택합니다.

```
┌────────────┐     ┌────────────┐
│  State A   │ ──> │  State B   │ ──> ...
└────────────┘     └────────────┘
     │                   │
     └───────────────────┘
         상태 전환
```

**예시: 호텔 예약 시스템**
- 예약 생성 → `confirm()` 가능, `cancel()` 불가
- 예약 확정 → `confirm()` 불가, `cancel()` 가능
- 예약일 전날 → `cancel()` 불가

### 2-2. 장애 조치 소켓 예제

서버 연결이 끊어져도 실패하지 않는 TCP 클라이언트 소켓을 만들어봅시다.

**failsafeSocket.js - 컨텍스트**
```javascript
import { OfflineState } from './offlineState.js'
import { OnlineState } from './onlineState.js'

export class FailsafeSocket {
  constructor(options) {
    this.options = options
    this.queue = []
    this.currentState = null
    this.socket = null
    this.states = {
      offline: new OfflineState(this),
      online: new OnlineState(this)
    }
    this.changeState('offline')
  }

  changeState(state) {
    console.log(`Activating state: ${state}`)
    this.currentState = this.states[state]
    this.currentState.activate()
  }

  send(data) {
    this.currentState.send(data)
  }
}
```

**offlineState.js - 오프라인 상태**
```javascript
export class OfflineState {
  constructor(failsafeSocket) {
    this.failsafeSocket = failsafeSocket
  }

  send(data) {
    // 오프라인일 때는 큐에 저장
    this.failsafeSocket.queue.push(data)
  }

  activate() {
    const retry = () => {
      setTimeout(() => this.activate(), 1000)
    }

    console.log('Trying to connect...')
    // 연결 시도, 성공하면 online으로 전환
    // 실패하면 1초 후 재시도
  }
}
```

**onlineState.js - 온라인 상태**
```javascript
export class OnlineState {
  constructor(failsafeSocket) {
    this.failsafeSocket = failsafeSocket
  }

  send(data) {
    // 온라인일 때는 바로 전송
    this.failsafeSocket.queue.push(data)
    this._safeWrite(data)
  }

  activate() {
    // 큐에 있던 데이터 모두 전송
    for (const data of this.failsafeSocket.queue) {
      this._safeWrite(data)
    }
  }
}
```

### 2-3. 실전에서

- **TCP/HTTP 연결 관리**: 연결/재연결/타임아웃 상태
- **게임 캐릭터**: 정지/걷기/달리기/공격 상태
- **주문 처리**: 대기/처리중/배송/완료 상태

---

## 3. 템플릿 (Template)

### 3-1. 템플릿 패턴이란?

템플릿 패턴은 **알고리즘의 골격을 정의**하고, 일부 단계를 하위 클래스에서 구현하도록 합니다.

```
┌─────────────────────────┐
│    AbstractTemplate     │
├─────────────────────────┤
│  + templateMethod()     │  ← 공통 로직
│  # step1() (abstract)   │  ← 하위 클래스에서 구현
│  # step2() (abstract)   │
└─────────────────────────┘
           △
     ┌─────┴─────┐
     │           │
┌────┴────┐ ┌────┴────┐
│ ClassA  │ │ ClassB  │
├─────────┤ ├─────────┤
│ step1() │ │ step1() │
│ step2() │ │ step2() │
└─────────┘ └─────────┘
```

### 3-2. 환경설정 관리자 예제

**configTemplate.js - 템플릿 클래스**
```javascript
import { promises as fs } from 'fs'
import objectPath from 'object-path'

export class ConfigTemplate {
  async load(file) {
    console.log(`Deserializing from ${file}`)
    this.data = this._deserialize(
      await fs.readFile(file, 'utf-8')
    )
  }

  async save(file) {
    console.log(`Serializing to ${file}`)
    await fs.writeFile(file, this._serialize(this.data))
  }

  get(path) {
    return objectPath.get(this.data, path)
  }

  set(path, value) {
    return objectPath.set(this.data, path, value)
  }

  // 템플릿 메서드 - 하위 클래스에서 구현해야 함
  _serialize() {
    throw new Error('_serialize() must be implemented')
  }

  _deserialize() {
    throw new Error('_deserialize() must be implemented')
  }
}
```

**jsonConfig.js - 구체 클래스**
```javascript
import { ConfigTemplate } from './configTemplate.js'

export class JsonConfig extends ConfigTemplate {
  _deserialize(data) {
    return JSON.parse(data)
  }

  _serialize(data) {
    return JSON.stringify(data, null, '  ')
  }
}
```

### 3-3. 전략 vs 템플릿

| 구분 | 전략 (Strategy) | 템플릿 (Template) |
|------|-----------------|-------------------|
| **변경 시점** | 런타임에 동적 변경 | 클래스 정의 시 결정 |
| **구조** | 컴포지션 (has-a) | 상속 (is-a) |
| **유연성** | 더 유연함 | 사전 패키징된 변형 |
| **사용 사례** | 런타임 전환 필요 | 고정된 변형 집합 |

### 3-4. 실전에서

- **Node.js 스트림**: `_write()`, `_read()`, `_transform()` 구현
- **React 클래스 컴포넌트**: `render()`, `componentDidMount()` 등

---

## 4. 반복자 (Iterator)

### 4-1. 반복자 패턴이란?

반복자 패턴은 **컬렉션의 요소들을 순회하기 위한 공통 인터페이스**를 제공합니다. JavaScript에서는 언어 차원에서 지원합니다.

### 4-2. 반복자 프로토콜

**반복자(Iterator)**: `next()` 함수를 구현한 객체

```javascript
const A_CHAR_CODE = 65
const Z_CHAR_CODE = 90

function createAlphabetIterator() {
  let currCode = A_CHAR_CODE
  return {
    next() {
      const currChar = String.fromCodePoint(currCode)
      if (currCode > Z_CHAR_CODE) {
        return { done: true }
      }
      currCode++
      return { value: currChar, done: false }
    }
  }
}

// 사용
const iterator = createAlphabetIterator()
let result = iterator.next()
while (!result.done) {
  console.log(result.value)  // A, B, C, ..., Z
  result = iterator.next()
}
```

**반복가능자(Iterable)**: `[Symbol.iterator]()` 함수를 구현한 객체

```javascript
export class Matrix {
  constructor(inMatrix) {
    this.data = inMatrix
  }

  [Symbol.iterator]() {
    let nextRow = 0
    let nextCol = 0
    return {
      next: () => {
        if (nextRow === this.data.length) {
          return { done: true }
        }
        const currVal = this.data[nextRow][nextCol]
        if (nextCol === this.data[nextRow].length - 1) {
          nextRow++
          nextCol = 0
        } else {
          nextCol++
        }
        return { value: currVal }
      }
    }
  }
}

// for...of 사용 가능
const matrix = new Matrix([['11', '12'], ['21', '22']])
for (const element of matrix) {
  console.log(element)  // 11, 12, 21, 22
}
```

### 4-3. 제너레이터

제너레이터는 반복자를 더 쉽게 구현할 수 있는 문법입니다.

```javascript
function* fruitGenerator() {
  yield 'peach'
  yield 'watermelon'
  return 'summer'
}

const gen = fruitGenerator()
console.log(gen.next())  // { value: 'peach', done: false }
console.log(gen.next())  // { value: 'watermelon', done: false }
console.log(gen.next())  // { value: 'summer', done: true }

// for...of 사용
for (const fruit of fruitGenerator()) {
  console.log(fruit)  // peach, watermelon (return 값은 출력 안됨)
}
```

**양방향 통신**
```javascript
function* twoWayGenerator() {
  const what = yield null
  yield 'Hello ' + what
}

const twoWay = twoWayGenerator()
twoWay.next()
console.log(twoWay.next('world'))  // { value: 'Hello world', done: false }
```

### 4-4. 비동기 반복자

비동기 작업이 필요한 반복에 사용합니다.

```javascript
export class CheckUrls {
  constructor(urls) {
    this.urls = urls
  }

  async *[Symbol.asyncIterator]() {
    for (const url of this.urls) {
      try {
        const checkResult = await superagent.head(url).redirects(2)
        yield `${url} is up, status: ${checkResult.status}`
      } catch (err) {
        yield `${url} is down, error: ${err.message}`
      }
    }
  }
}

// for await...of 사용
const checkUrls = new CheckUrls([
  'https://nodejsdesignpatterns.com',
  'https://example.com'
])

for await (const status of checkUrls) {
  console.log(status)
}
```

### 4-5. 비동기 반복자와 스트림

Node.js 스트림은 비동기 반복가능자입니다.

```javascript
import split from 'split2'

async function main() {
  const stream = process.stdin.pipe(split())
  for await (const line of stream) {
    console.log(`You wrote: ${line}`)
  }
}
```

| 구분 | 스트림 | 비동기 반복자 |
|------|--------|---------------|
| **데이터 흐름** | Push (데이터가 밀려옴) | Pull (요청 시 가져옴) |
| **버퍼링** | 내장 버퍼링 + 백프레셔 | 없음 |
| **연결** | `pipe()` API | 표준화된 방법 없음 |

### 4-6. 실전에서

- **@databases/pg, mysql, sqlite**: `queryStream()` - DB 결과 반복
- **zeromq**: 메시지 반복
- **Node.js readline**: 파일 라인별 읽기

---

## 5. 미들웨어 (Middleware)

### 5-1. 미들웨어 패턴이란?

미들웨어 패턴은 **처리 단계를 파이프라인으로 구성**하여 데이터를 전처리/후처리합니다. Node.js 생태계의 독특한 패턴입니다.

```
      use()
        │
        ▼
┌───────────────────────────────────────────────┐
│              Middleware Manager               │
├───────────────────────────────────────────────┤
│ 입력 → [MW A] → [MW B] → [MW C] → [MW D] → 출력 │
└───────────────────────────────────────────────┘
```

**주요 특징**:
- `use()` 함수로 미들웨어 등록
- 파이프라인의 각 단계가 이전 단계의 결과를 입력으로 받음
- 처리 중단 가능

### 5-2. Express 스타일 미들웨어

```javascript
function middleware(req, res, next) {
  // 처리 로직
  next()  // 다음 미들웨어 호출
}

app.use(bodyParser())
app.use(compression())
app.use(session())
app.use(csrf())
```

**Express 미들웨어 예시**:
- 요청 본문 분석
- 압축/압축해제
- 접근 로그 생성
- 세션 관리
- CSRF 보호

### 5-3. Koa 스타일 미들웨어 (async/await)

```javascript
async function middleware(ctx, next) {
  // 요청 전 처리
  await next()
  // 응답 후 처리
}
```

### 5-4. ZeroMQ 미들웨어 예제

**zmqMiddlewareManager.js**
```javascript
export class ZmqMiddlewareManager {
  constructor(socket) {
    this.socket = socket
    this.inboundMiddleware = []
    this.outboundMiddleware = []
    this.handleIncomingMessages()
  }

  async handleIncomingMessages() {
    for await (const [message] of this.socket) {
      await this.executeMiddleware(this.inboundMiddleware, message)
    }
  }

  async send(message) {
    const finalMessage = await this.executeMiddleware(
      this.outboundMiddleware, message
    )
    return this.socket.send(finalMessage)
  }

  use(middleware) {
    if (middleware.inbound) {
      this.inboundMiddleware.push(middleware.inbound)
    }
    if (middleware.outbound) {
      // 아웃바운드는 역순으로 실행
      this.outboundMiddleware.unshift(middleware.outbound)
    }
  }

  async executeMiddleware(middlewares, initialMessage) {
    let message = initialMessage
    for await (const middlewareFunc of middlewares) {
      message = await middlewareFunc.call(this, message)
    }
    return message
  }
}
```

**jsonMiddleware.js**
```javascript
export const jsonMiddleware = function() {
  return {
    inbound(message) {
      return JSON.parse(message.toString())
    },
    outbound(message) {
      return Buffer.from(JSON.stringify(message))
    }
  }
}
```

### 5-5. 실전에서

- **Express**: 웹 프레임워크 미들웨어
- **Koa**: async/await 기반 미들웨어
- **Middy**: AWS Lambda 미들웨어

---

## 6. 명령 (Command)

### 6-1. 명령 패턴이란?

명령 패턴은 **실행에 필요한 정보를 객체로 캡슐화**합니다. 함수를 직접 호출하는 대신, 호출 의도를 나타내는 객체를 만듭니다.

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │ -> │ Command  │ -> │ Invoker  │ -> │  Target  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
   명령 생성       실행 정보       명령 실행       실제 동작
```

**명령 패턴의 장점**:
- **지연 실행**: 나중에 실행하도록 예약
- **직렬화**: 네트워크 전송 가능 (RPC)
- **기록 유지**: 실행된 작업 히스토리
- **실행 취소**: 명령 실행 전 상태로 복원
- **그룹화**: 원자적 트랜잭션 생성

### 6-2. Task 패턴 (단순한 명령)

```javascript
function createTask(target, ...args) {
  return () => {
    target(...args)
  }
}

// 또는 bind 사용
const task = target.bind(null, ...args)
```

### 6-3. 실행 취소/직렬화 지원

**statusUpdateService.js - 대상(Target)**
```javascript
const statusUpdates = new Map()

export const statusUpdateService = {
  postUpdate(status) {
    const id = Math.floor(Math.random() * 1000000)
    statusUpdates.set(id, status)
    console.log(`Status posted: ${status}`)
    return id
  },

  destroyUpdate(id) {
    statusUpdates.delete(id)
    console.log(`Status removed: ${id}`)
  }
}
```

**createPostStatusCmd.js - 명령(Command)**
```javascript
export function createPostStatusCmd(service, status) {
  let postId = null

  return {
    run() {
      postId = service.postUpdate(status)
    },

    undo() {
      if (postId) {
        service.destroyUpdate(postId)
        postId = null
      }
    },

    serialize() {
      return { type: 'status', action: 'post', status }
    }
  }
}
```

**invoker.js - 호출자(Invoker)**
```javascript
export class Invoker {
  constructor() {
    this.history = []
  }

  run(cmd) {
    this.history.push(cmd)
    cmd.run()
    console.log('Command executed', cmd.serialize())
  }

  delay(cmd, delay) {
    setTimeout(() => {
      console.log('Executing delayed command', cmd.serialize())
      this.run(cmd)
    }, delay)
  }

  undo() {
    const cmd = this.history.pop()
    cmd.undo()
    console.log('Command undone', cmd.serialize())
  }

  async runRemotely(cmd) {
    await superagent
      .post('http://localhost:3000/cmd')
      .send({ json: cmd.serialize() })
    console.log('Command executed remotely', cmd.serialize())
  }
}
```

**client.js - 클라이언트(Client)**
```javascript
import { createPostStatusCmd } from './createPostStatusCmd.js'
import { statusUpdateService } from './statusUpdateService.js'
import { Invoker } from './invoker.js'

const invoker = new Invoker()

// 명령 생성
const command = createPostStatusCmd(statusUpdateService, 'HI!')

// 즉시 실행
invoker.run(command)

// 실행 취소
invoker.undo()

// 3초 후 실행
invoker.delay(command, 3000)

// 원격 실행
invoker.runRemotely(command)
```

### 6-4. 실전에서

- **텍스트 에디터**: 실행 취소/재실행
- **분산 시스템**: 작업 큐, 이벤트 소싱
- **협업 도구**: OT(Operational Transformation)

---

## 요약

| 패턴 | 목적 | 핵심 개념 |
|------|------|----------|
| **전략** | 런타임 알고리즘 교체 | 컨텍스트 + 상호 교환 가능한 전략 |
| **상태** | 상태별 동작 변경 | 전략의 변형, 상태 전환 |
| **템플릿** | 알고리즘 구조 재사용 | 상속, 템플릿 메서드 |
| **반복자** | 컬렉션 순회 | Iterator/Iterable 프로토콜, 제너레이터 |
| **미들웨어** | 파이프라인 처리 | use(), next(), 전처리/후처리 |
| **명령** | 호출 정보 캡슐화 | 실행 취소, 직렬화, 지연 실행 |

### 패턴 선택 가이드

- **런타임에 동작을 변경해야 한다** → 전략
- **상태에 따라 동작이 달라진다** → 상태
- **알고리즘 구조는 같고 일부만 다르다** → 템플릿
- **컬렉션을 순회해야 한다** → 반복자
- **요청을 전처리/후처리해야 한다** → 미들웨어
- **작업을 지연/취소/전송해야 한다** → 명령

---

## 연습문제

### 연습문제 9.1: 전략을 사용한 로깅
`debug()`, `info()`, `warn()`, `error()` 함수를 가진 로깅 컴포넌트를 구현합니다. 로그 메시지가 기록되는 위치를 정의할 수 있는 전략들(ConsoleStrategy, FileStrategy)을 구현합니다.

### 연습문제 9.2: 템플릿을 사용한 로깅
연습문제 9.1과 동일한 로깅 컴포넌트를 템플릿 패턴으로 구현합니다. ConsoleLogger와 FileLogger 클래스를 만들어 전략과 템플릿 접근 방식의 차이점을 이해합니다.

### 연습문제 9.3: 아이템 저장소
창고 아이템을 모델링하는 WarehouseItem 클래스를 상태 패턴으로 구현합니다.
- 세 가지 상태: 준비(ready), 입고(stored), 배송(delivered)
- 세 가지 함수: `store(locationId)`, `deliver(address)`, `describe()`
- 상태 전환 규칙 준수

### 연습문제 9.4: 미들웨어를 사용한 로깅
미들웨어 패턴으로 로깅 컴포넌트를 구현합니다. `serialize()` 미들웨어와 `saveToFile()` 미들웨어를 추가하여 메시지 처리 방식을 사용자 정의할 수 있도록 합니다.

### 연습문제 9.5: 반복자를 사용한 대기열
AsyncQueue 클래스를 구현합니다. `enqueue()` 함수로 항목을 추가하고, `@@asyncIterable`을 구현하여 대기열 요소를 비동기적으로 처리할 수 있도록 합니다.

---

## 참고 자료

### 실습 코드
`code/` 디렉토리에서 각 패턴의 구현 예제를 확인할 수 있습니다.

### 관련 링크
- [Express.js](https://expressjs.com/) - 미들웨어 패턴의 대표적인 예
- [Passport.js](http://www.passportjs.org/) - 전략 패턴 활용
- [ZeroMQ](https://zeromq.org/) - 메시징 라이브러리
- [Koa.js](https://koajs.com/) - async/await 미들웨어
