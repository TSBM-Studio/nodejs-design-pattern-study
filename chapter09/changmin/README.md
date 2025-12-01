# Node.js Design Patterns

## Chapter 9 - Behavioral Design Patterns (행위 패턴)

객체 간 상호작용과 동작의 유연성에 초점을 둔 패턴을 다루는 챕터

### 핵심 내용

"어떻게 객체들이 협력하며 일을 처리할 것인가?"에 대한 문제를 다룸

행위(Behavior)를 교체, 확장, 캡슐화하는 설계 기법

Node.js의 비동기/이벤트 기반 모델과 가장 깊게 연결되는 패턴들임

- Strategy: 알고리즘(정책)을 캡슐화하여 런타임에 교체 가능하게 함
- State: 객체의 상태 변화에 따라 행동을 전환함
- Template Method: 알고리즘의 골격은 유지하되 세부 단계만 변경함
- Iterator: 컬렉션의 내부 구조와 상관없이 표준화된 방식으로 순회함
- Middleware: 요청 처리 과정을 체인(Chain) 형태로 연결하여 처리함
- Command: 요청 자체를 객체로 캡슐화하여 저장, 재시도, 취소 등을 가능하게 함

---

## 1. Strategy Pattern

### 1.1 Strategy Pattern이란?

조건문 대신 알고리즘을 객체로 분리하여 런타임에 교체 가능하게 하는 패턴

### 1.2 주요 목적

**알고리즘의 캡슐화 및 교체 -> 복잡한 분기(if-else) 제거 및 유연한 전략 선택**

```javascript
class SmsSender {
  send(msg) {
    console.log("SMS:", msg);
  }
}

class EmailSender {
  send(msg) {
    console.log("EMAIL:", msg);
  }
}

class MessageService {
  constructor(strategy) {
    this.strategy = strategy;
  }

  notify(msg) {
    this.strategy.send(msg);
  }
}

// use case
const service = new MessageService(new SmsSender());
service.notify("Hello!");

// 런타임에 전략 교체
service.strategy = new EmailSender();
service.notify("Hi!");
```

**플러그인 방식 확장 용이 -> 새로운 전략 추가 시 기존 코드 수정 불필요 (OCP 준수)**

---

## 2. State Pattern

### 2.1 State Pattern이란?

객체의 상태를 별도 클래스로 캡슐화하여, 상태 변화에 따라 행동이 자연스럽게 전환되도록 하는 패턴

### 2.2 주요 목적

**상태 중심의 행동 전환 -> 거대한 switch 문 제거 및 FSM(Finite State Machine) 구현**

```javascript
class PendingState {
  next(order) {
    console.log("Order approved");
    order.setState(new ApprovedState());
  }
}

class ApprovedState {
  next(order) {
    console.log("Order shipped");
    order.setState(new ShippedState());
  }
}

class ShippedState {
  next() {
    console.log("Already shipped");
  }
}

class Order {
  constructor() {
    this.state = new PendingState();
  }

  setState(state) {
    this.state = state;
  }

  next() {
    this.state.next(this);
  }
}

// use case
const order = new Order();
order.next();
order.next();
order.next();
```

**상태별 행동을 응집력 있게 관리 -> 상태 전이 로직의 복잡성 해소**

---

## 3. Template Method Pattern

### 3.1 Template Method Pattern이란?

알고리즘의 전체 구조(골격)는 부모 클래스에서 정의하고, 변경이 필요한 부분만 자식 클래스에서 구현하는 패턴

### 3.2 주요 목적

**공통 로직 재사용 및 확장 지점 제공 -> "전체 흐름은 같지만 세부 내용이 다를 때" 유용**

```javascript
class Notifier {
  send(message) {
    this.validate(message);
    this.write(message);
    this.log(message);
  }

  validate() {} // Hook (선택적 구현)
  write() {} // Abstract Method (필수 구현)

  log(msg) {
    console.log("Sent:", msg);
  }
}

class SlackNotifier extends Notifier {
  write(msg) {
    console.log("Slack:", msg);
  }
}

// use case
new SlackNotifier().send("Message");
```

**Strategy 패턴과의 차이 -> Strategy는 "전체 알고리즘" 교체, Template는 "일부 단계" 변경**

---

## 4. Iterator Pattern

### 4.1 Iterator Pattern이란?

컬렉션의 내부 구조를 노출하지 않고 요소들을 순차적으로 접근할 수 있게 하는 패턴

### 4.2 주요 목적

**순회 방식의 표준화 -> 데이터 구조(Array, Map, Set 등)에 상관없이 동일한 루프 사용**

```javascript
const users = {
  data: ["a", "b", "c"],
  *[Symbol.iterator]() {
    for (const u of this.data) yield u;
  },
};

// use case
for (const user of users) {
  console.log(user);
}
```

**JS Iterable 프로토콜 활용 -> Stream API, Async Iterator와 자연스럽게 연동**

---

## 5. Middleware Pattern

### 5.1 Middleware Pattern이란?

Chain of Responsibility의 변형으로, 요청 처리 단계를 파이프라인 형태로 연결하여 순차적으로 실행하는 패턴

### 5.2 주요 목적

**요청 처리 흐름 제어 및 필터링 -> 각 단계에서 요청을 가공하거나 중단할 수 있음**

```javascript
function m1(ctx, next) {
  console.log("m1");
  next();
}

function m2(ctx, next) {
  console.log("m2");
  next();
}

function execute(ctx, ...middlewares) {
  let i = 0;
  const runner = () => {
    const mw = middlewares[i++];
    if (mw) mw(ctx, runner);
  };
  runner();
}

// use case
execute({}, m1, m2);
```

**Express/NestJS 파이프라인의 근간 -> "요청 전/후 처리" 및 "관심사 분리"에 최적**

---

## 6. Command Pattern

### 6.1 Command Pattern이란?

요청(메서드 호출) 자체를 하나의 객체로 캡슐화하여 처리하는 패턴

### 6.2 주요 목적

**작업 실행의 캡슐화 -> 요청을 큐에 저장, 지연 실행, 실행 취소(Undo), 재시도(Retry) 가능**

```javascript
class CommandQueue {
  constructor() {
    this.queue = [];
  }
  add(cmd) {
    this.queue.push(cmd);
  }
  run() {
    this.queue.forEach((cmd) => cmd.execute());
  }
}

class LogCommand {
  execute() {
    console.log("Write Log");
  }
}

// use case
const worker = new CommandQueue();
worker.add(new LogCommand());
worker.run();
```

**메시지/이벤트 처리 모델에 적합 -> 작업 내역 관리 및 비동기 처리에 유용**

---

## 결론

Node.js는 비동기 이벤트 기반 환경이므로 행위 패턴이 시스템의 확장성과 안정성에 큰 영향을 줌

| 패턴           | 목적                  | Node.js 활용 예                             |
| :------------- | :-------------------- | :------------------------------------------ |
| **Strategy**   | 알고리즘 교체         | 멀티채널 알림, 인증 전략(Passport)          |
| **State**      | 상태 기반 행동 전환   | 주문/결제 흐름(FSM), Connection 상태 관리   |
| **Template**   | 공통 흐름 유지 + 확장 | BaseController, 데이터 파싱 골격            |
| **Iterator**   | 표준 순회 방식        | Stream, Generator, Async Iterator           |
| **Middleware** | 파이프라인 처리       | Express/NestJS 미들웨어, Interceptor        |
| **Command**    | 요청 캡슐화           | Job Queue(Bull), Undo/Redo, Task Scheduling |

**특히 이벤트/메시징 기반 시스템 설계 시 필수적으로 고려해야 할 패턴들임**

- 실패 재시도/지연 실행 -> Command
- 복잡한 흐름 제어 -> State
- 다양한 정책 적용 -> Strategy
- 요청 처리 파이프라인 -> Middleware
