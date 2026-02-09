# Chapter 9. Behavioral Design Patterns

행동 패턴(Behavioral Patterns)은 객체 간의 책임 분배와 알고리즘 교체에 집중한다. Node.js의 비동기 모델 및 이벤트 기반 아키텍처와 매우 잘 어울린다.

## 9.1 Strategy Pattern

### 9.1.1 정의

GoF의 정의

> Strategy는 알고리즘군을 정의하고 각각을 캡슐화하여 교환 가능하게 만드는 패턴이다. Strategy를 사용하면 알고리즘을 사용하는 클라이언트와 독립적으로 알고리즘을 변경할 수 있다.

Node.js 관점

Strategy 패턴은 런타임에 알고리즘이나 동작을 교체할 수 있게 한다. Node.js에서는 함수가 일급 객체이므로 Strategy를 매우 자연스럽게 구현할 수 있다.

### 9.1.2 예제: 멀티 포맷 설정 객체

책에서는 Config 객체가 다양한 직렬화 전략(JSON, INI, YAML)을 지원하는 예제를 제시한다.

```javascript
import fs from 'fs'
import objectPath from 'object-path'

export class Config {
  constructor(formatStrategy) {
    this.data = {}
    this.formatStrategy = formatStrategy
  }

  get(path) {
    return objectPath.get(this.data, path)
  }

  set(path, value) {
    return objectPath.set(this.data, path, value)
  }

  async load(file) {
    console.log(`Deserializing from ${file}`)
    const rawData = await fs.promises.readFile(file, 'utf-8')
    this.data = this.formatStrategy.deserialize(rawData)
  }

  async save(file) {
    console.log(`Serializing to ${file}`)
    const serialized = this.formatStrategy.serialize(this.data)
    await fs.promises.writeFile(file, serialized)
  }
}
```

JSON 전략:

```javascript
export const jsonStrategy = {
  deserialize: data => JSON.parse(data),
  serialize: data => JSON.stringify(data, null, '  ')
}
```

INI 전략:

```javascript
import ini from 'ini'

export const iniStrategy = {
  deserialize: data => ini.parse(data),
  serialize: data => ini.stringify(data)
}
```

사용 예시:

```javascript
// JSON 전략 사용
// 전략을 처음 초기화 할때 먹여줘야한다.
const jsonConfig = new Config(jsonStrategy)
await jsonConfig.load('config.json')
jsonConfig.set('db.host', 'localhost')
await jsonConfig.save('config.json')

// INI 전략으로 교체
const iniConfig = new Config(iniStrategy)
await iniConfig.load('config.ini')
iniConfig.set('db.host', 'localhost')
await iniConfig.save('config.ini')
```

### 9.1.3 함수형 Strategy

JavaScript에서는 Strategy를 단순히 함수로도 구현할 수 있다 (함수가 1급 객체이므로 반환할 수 있기 때문):

```javascript
function createConfig(deserialize, serialize) {
  let data = {}

  return {
    get(path) { return objectPath.get(data, path) },
    set(path, value) { objectPath.set(data, path, value) },
    async load(file) {
      data = deserialize(await fs.promises.readFile(file, 'utf-8'))
    },
    async save(file) {
      await fs.promises.writeFile(file, serialize(data))
    }
  }
}

const config = createConfig(
  JSON.parse,
  data => JSON.stringify(data, null, 2)
)
```

### 9.1.4 장단점

장점

- 알고리즘/포맷을 런타임에 교체 가능
- if-else 분기문 제거 (개방-폐쇄 원칙)
- 테스트하기 쉬움 (전략별로 분리 테스트)
- 새로운 전략 추가가 용이

단점

- 클라이언트가 전략 간 차이를 알아야 함
- 인터페이스 호환성을 유지해야 함

### 9.1.5 사용 시점

- 복수의 알고리즘/포맷을 지원해야 할 때
- if-else 분기가 많아지는 상황
- 데이터 직렬화/역직렬화 방식이 다양할 때
- 결제 방식, 인증 방식 등 런타임 선택이 필요할 때

## 9.2 State Pattern

### 9.2.1 정의

GoF의 정의

> State 패턴은 객체의 내부 상태가 변경될 때 객체의 행동을 변경할 수 있게 하는 패턴이다. 객체가 클래스를 바꾼 것처럼 보이게 한다.

**"클래스를 바꾼 것처럼 보인다"는 의미:**

State 패턴 없이 조건문으로 구현하면:

```javascript
class Socket {
  constructor() {
    this.isOnline = false
  }
  
  send(data) {
    if (this.isOnline) {
      this.socket.write(data)  // 온라인: 즉시 전송
    } else {
      this.queue.push(data)    // 오프라인: 큐에 저장
    }
  }
}
```

State 패턴을 사용하면:

```javascript
// 같은 send() 메서드지만 상태에 따라 완전히 다르게 동작
socket.send(data)  // 오프라인 상태: 큐에 저장
socket.send(data)  // 온라인 상태: 즉시 전송

// 마치 socket이 OfflineSocket 클래스에서 OnlineSocket 클래스로 바뀐 것처럼 보임
```

- 조건문(if/switch) 없이 상태 객체만 교체
- 같은 메서드 호출이지만 완전히 다른 행동
- 외부에서는 상태 변경을 인식하지 못함 (같은 인터페이스)

Node.js 관점

State 패턴은 상태에 따라 객체의 행동을 변경한다. 특히 비동기 흐름 제어나 네트워크 연결 관리에 유용하다.

### 9.2.2 예제: Failsafe Socket

책에서는 네트워크 소켓의 상태를 관리하는 예제를 제시한다.

```javascript
class OfflineState {
  constructor(failsafeSocket) {
    this.failsafeSocket = failsafeSocket
    this.queue = []
  }

  send(data) {
    this.queue.push(data)
  }

  activate() {
    const socket = new Socket()
    socket.connect(this.failsafeSocket.options)
    
    socket.on('connect', () => {
      this.failsafeSocket.changeState(new OnlineState(this.failsafeSocket, socket))
      
      // Flush queued messages
      for (const data of this.queue) {
        socket.write(data)
      }
      this.queue = []
    })
  }
}

class OnlineState {
  constructor(failsafeSocket, socket) {
    this.failsafeSocket = failsafeSocket
    this.socket = socket
  }

  send(data) {
    this.socket.write(data)
  }

  activate() {
    this.socket.on('error', () => {
      this.failsafeSocket.changeState(new OfflineState(this.failsafeSocket))
    })
  }
}

class FailsafeSocket {
  constructor(options) {
    this.options = options
    this.state = new OfflineState(this)
  }

  send(data) {
    this.state.send(data)
  }

  changeState(newState) {
    this.state = newState
    this.state.activate()
  }

  connect() {
    this.state.activate()
  }
}
```

### 9.2.3 장단점

장점

- 상태 전환 로직을 체계적으로 관리
- 각 상태를 독립적인 객체로 캡슐화
- 새로운 상태 추가가 용이

단점

- 상태가 많아지면 클래스 수 증가
- 상태 전환 로직이 복잡해질 수 있음
- 암시적 상태변환으로 예측이나 디버깅이 어렵다.
  - getter 함수로 명시적으로 상태를 노출 시킬 수 있다.
  - node.js는 명시적 코드를 선호하므로 잘 사용하지 않는듯..?

### 9.2.4 사용 시점

- 객체의 행동이 상태에 따라 크게 달라질 때
- 상태 전환이 복잡한 경우
- 네트워크 연결, UI 상태 관리 등

## 9.3 Template Pattern

### 9.3.1 정의

GoF의 정의

> Template Method는 알고리즘의 구조를 메서드에 정의하고, 하위 클래스에서 알고리즘 구조의 변경 없이 알고리즘을 재정의하는 패턴이다.

Node.js 관점

Template 패턴은 알고리즘의 뼈대를 정의하고 일부 단계를 서브클래스에 위임한다. Strategy와 유사하지만, 전략 선택이 클래스 정의 시점에 확정된다는 점이 다르다.

### 9.3.2 예제: Config Template

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

  _serialize() {
    throw new Error('_serialize() must be implemented')
  }

  _deserialize() {
    throw new Error('_deserialize() must be implemented')
  }
}
```

JSON 구현:

```javascript
export class JsonConfig extends ConfigTemplate {
  _deserialize(data) {
    return JSON.parse(data)
  }

  _serialize(data) {
    return JSON.stringify(data, null, '  ')
  }
}
```

INI 구현:

```javascript
import ini from 'ini'

export class IniConfig extends ConfigTemplate {
  _deserialize(data) {
    return ini.parse(data)
  }

  _serialize(data) {
    return ini.stringify(data)
  }
}
```

### 9.3.3 Node.js Stream에서의 Template 패턴

Node.js의 Stream 구현이 대표적인 Template 패턴 예시다:

```javascript
import { Readable } from 'stream'

class MyReadable extends Readable {
  constructor(options) {
    super(options)
    // initialization
  }

  // Template method to implement
  _read(size) {
    // Push data to internal buffer
    this.push(data)
    // or this.push(null) to signal end
  }
}
```

`_read()`, `_write()`, `_transform()` 등은 Template Method의 전형적인 예다.

### 9.3.4 장단점

장점

- 공통 로직을 재사용
- 알고리즘 구조를 보장
- 코드 중복 제거

단점

- 상속 기반이라 유연성이 떨어짐
- 런타임 전략 변경 불가 (Strategy가 더 유연)

### 9.3.5 사용 시점

- 일정한 절차가 고정되고 일부 단계만 변경될 때
- Node.js Stream 구현 시
- 프레임워크/라이브러리 확장 포인트 제공

### 9.3.6 Strategy vs Template

| 특성 | Strategy | Template |
|------|----------|----------|
| 전략 선택 시점 | 런타임 | 클래스 정의 시점 |
| 구현 방식 | Composition | Inheritance |
| 유연성 | 높음 (런타임 교체) | 낮음 (고정) |
| 적용 | 알고리즘 교체 | 알고리즘 구조 정의 |

## 9.4 Iterator Pattern

### 9.4.1 정의

GoF의 정의

> Iterator는 내부 구조를 노출하지 않고 집합 객체의 원소들을 순차적으로 접근할 수 있는 방법을 제공하는 패턴이다.

Node.js 관점

JavaScript는 ES6부터 Iterator 프로토콜을 지원하며, ES2018부터는 비동기 Iterator도 지원한다.

### 9.4.2 Iterator 프로토콜

동기 Iterator:

```javascript
const arr = [1, 2, 3]
const iterator = arr[Symbol.iterator]()

console.log(iterator.next()) // { value: 1, done: false }
console.log(iterator.next()) // { value: 2, done: false }
console.log(iterator.next()) // { value: 3, done: false }
console.log(iterator.next()) // { value: undefined, done: true }
```

for...of 사용:

```javascript
for (const item of arr) {
  console.log(item)
}
```

### 9.4.3 비동기 Iterator

Node.js에서는 Stream, ZeroMQ 등이 비동기 Iterator를 지원한다.
각 `await`는 microtask를 생성하므로 Event Loop를 블로킹하지 않는다.

```javascript
import { createReadStream } from 'fs'

async function readLines(filename) {
  const stream = createReadStream(filename, { encoding: 'utf-8' })
  
  for await (const chunk of stream) {
    console.log(chunk)
  }
}
```

ZeroMQ 예시:

```javascript
import zmq from 'zeromq'

async function main() {
  const socket = new zmq.Pull()
  socket.connect('tcp://localhost:5000')
  
  for await (const [msg] of socket) {
    console.log('Received:', msg.toString())
  }
}
```

### 9.4.4 커스텀 비동기 Iterator 구현

```javascript
class AsyncDataSource {
  constructor(data) {
    this.data = data
    this.index = 0
  }

  async *[Symbol.asyncIterator]() {
    while (this.index < this.data.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
      yield this.data[this.index++]
    }
  }
}

// Usage
const source = new AsyncDataSource([1, 2, 3, 4, 5])
for await (const item of source) {
  console.log(item)
}
```

### 9.4.5 장단점

장점

- 내부 구조 노출 없이 순회 가능
- 비동기 데이터 스트림 처리에 자연스러움
- for...of, for await...of로 편리한 사용

단점

- Iterator 생성 비용
- 단방향 순회만 가능 (기본 Iterator)
- 만약 Iteration 해야할 작업들이 너무 많아서 microtask를 다 채워버리면..?

### 9.4.6 사용 시점

- 비동기 데이터 스트림 처리 (Stream, Socket)
- 메시지 큐 소비
- 대용량 데이터 지연 로딩

## 9.5 Middleware Pattern

### 9.5.1 정의

Middleware 패턴은 요청/응답을 일련의 처리 단계(파이프라인)로 나누어 처리하는 패턴이다. Express, Koa, Redux 등 Node.js 생태계에서 가장 널리 사용되는 패턴 중 하나다.

### 9.5.2 Express 스타일 Middleware

기본 구조:

```javascript
function middleware1(req, res, next) {
  console.log('Middleware 1')
  next()
}

function middleware2(req, res, next) {
  console.log('Middleware 2')
  next()
}

app.use(middleware1)
app.use(middleware2)
```

### 9.5.3 ZeroMQ Middleware Manager (책 예시)

책에서는 ZeroMQ 기반 양방향 미들웨어 관리자를 제시한다.

```javascript
export class MiddlewareManager {
  constructor(socket) {
    this.socket = socket
    this.inboundMiddleware = []
    this.outboundMiddleware = []
    this.handleIncomingMessages().catch(err => console.error(err))
  }

  async handleIncomingMessages() {
    for await (const [message] of this.socket) {
      await this.executeMiddleware(this.inboundMiddleware, message)
        .catch(err => console.error(err))
    }
  }

  async send(message) {
    const finalMessage = await this.executeMiddleware(
      this.outboundMiddleware,
      message
    )
    return this.socket.send(finalMessage)
  }

  use(middleware) {
    if (middleware.inbound) {
      this.inboundMiddleware.push(middleware.inbound)
    }
    if (middleware.outbound) {
      this.outboundMiddleware.unshift(middleware.outbound)
    }
  }

  async executeMiddleware(middlewareList, initialMessage) {
    let message = initialMessage
    for (const middlewareFn of middlewareList) {
      message = await middlewareFn.call(this, message)
    }
    return message
  }
}
```

### 9.5.4 미들웨어 예시

JSON 미들웨어:

```javascript
export const jsonMiddleware = () => ({
  inbound(message) {
    return JSON.parse(message.toString())
  },
  outbound(message) {
    return Buffer.from(JSON.stringify(message))
  }
})
```

압축 미들웨어:

```javascript
import zlib from 'zlib'
import { promisify } from 'util'

const deflate = promisify(zlib.deflate)
const inflate = promisify(zlib.inflate)

export const zlibMiddleware = () => ({
  async inbound(message) {
    return inflate(message)
  },
  async outbound(message) {
    return deflate(message)
  }
})
```

사용:

```javascript
const manager = new MiddlewareManager(socket)
manager.use(zlibMiddleware())
manager.use(jsonMiddleware())

// Send
await manager.send({ type: 'hello', data: 'world' })
// 1. JSON.stringify
// 2. zlib.deflate
// 3. socket.send
```

### 9.5.5 Koa 스타일 Middleware (onion model)

Koa는 양파 모델(onion model)을 사용한다:

```javascript
app.use(async (ctx, next) => {
  console.log('>> 1')
  await next()
  console.log('<< 1')
})

app.use(async (ctx, next) => {
  console.log('>> 2')
  await next()
  console.log('<< 2')
})

// Output:
// >> 1
// >> 2
// << 2
// << 1
```

### 9.5.6 장단점

장점

- 횡단 관심사(로깅, 인증, 압축) 분리
- 재사용 가능한 처리 단계
- 조합 가능 (composable)
- 순서 제어 용이

단점

- 미들웨어가 많아지면 디버깅 어려움
- 순서 의존성 관리 필요
- 에러 처리 복잡

### 9.5.7 사용 시점

- 웹 서버 요청 처리 (Express, Koa)
- 메시지 기반 통신 (ZeroMQ, RabbitMQ)
- Redux 같은 상태 관리
- 플러그인 시스템

## 9.6 Command Pattern

### 9.6.1 정의

GoF의 정의

> Command는 요청을 객체로 캡슐화하여 매개변수화하고, 요청을 큐에 저장하거나 로그로 기록하거나 실행 취소 가능하게 하는 패턴이다.

Node.js 관점

Command 패턴은 작업을 객체로 만들어 실행, 큐잉, 취소/재실행을 가능하게 한다. 작업 큐, 메시지 큐와 잘 결합된다.

### 9.6.2 기본 예시

```javascript
class Command {
  execute() {
    throw new Error('execute() must be implemented')
  }

  undo() {
    throw new Error('undo() must be implemented')
  }
}

class AddTaskCommand extends Command {
  constructor(taskList, task) {
    super()
    this.taskList = taskList
    this.task = task
  }

  execute() {
    this.taskList.addTask(this.task)
  }

  undo() {
    this.taskList.removeTask(this.task)
  }
}

// Usage
const taskList = new TaskList()
const cmd = new AddTaskCommand(taskList, 'Buy milk')
cmd.execute()
cmd.undo()
```

### 9.6.3 실전 예시: 작업 스케줄러

```javascript
class TaskScheduler {
  constructor() {
    this.queue = []
  }

  addCommand(command) {
    this.queue.push(command)
  }

  async run() {
    for (const command of this.queue) {
      await command.execute()
    }
    this.queue = []
  }
}
```

### 9.6.4 장단점

장점

- 요청을 객체화하여 유연성 확보
- 실행 취소/재실행 구현 용이
- 작업 큐, 로깅에 적합
- 매크로 명령(복합 명령) 구성 가능

단점

- Command 클래스 수 증가
- 간단한 작업에는 오버엔지니어링

### 9.6.5 사용 시점

- 작업 큐 (Task Queue, Job Queue)
- Undo/Redo 기능
- 트랜잭션 관리
- 메시지 큐 (AWS SQS, RabbitMQ)
