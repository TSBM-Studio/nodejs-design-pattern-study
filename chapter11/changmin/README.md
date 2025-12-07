# Node.js Design Patterns

## Chapter 11 - Advanced Recipes (고급 레시피)

Node.js 개발 시 흔히 마주치는 까다로운 문제들을 해결하기 위한 4가지 고급 패턴(레시피)을 다루는 챕터

### 핵심 내용

비동기 프로그래밍의 복잡성을 관리하고, CPU 집약적인 작업을 효율적으로 처리하는 방법에 초점

- **Asynchronously Initialized Components**: 초기화가 완료되지 않은 컴포넌트를 안전하게 사용하는 방법
- **Asynchronous Request Batching and Caching**: 중복 요청을 방지하고 결과를 재사용하여 고부하 상황에서 성능 최적화
- **Canceling Asynchronous Operations**: 불필요해진 긴 비동기 작업을 중단하여 리소스 낭비 방지
- **Running CPU-bound Tasks**: 이벤트 루프를 차단하지 않고 CPU 집약적인 작업을 처리하는 방법

---

## 1. Dealing with Asynchronously Initialized Components

### 1.1 문제 정의

데이터베이스 드라이버나 미들웨어 클라이언트처럼 **초기화에 네트워크 통신이 필요하여 즉시 사용할 수 없는 컴포넌트**를 다룰 때 발생하는 문제

**문제점:** 컴포넌트가 완전히 초기화되기 전에 클라이언트가 API를 호출하면 오류가 발생하거나 예상치 못한 동작을 할 수 있음

### 1.2 해결책

#### 1.2.1 Local Initialization Check (로컬 초기화 확인)

API를 호출할 때마다 초기화 여부를 확인하고, 초기화되지 않았다면 오류를 반환하거나 기다리는 방식

- **단점**: 모든 메서드에 체크 로직이 들어가야 하므로 **코드가 복잡해지고 중복이 발생**함 (Business Logic과 Initialization Logic의 혼재)

#### 1.2.2 Delayed Startup (지연된 시작)

모든 비동기 서비스가 초기화될 때까지 애플리케이션의 시작 자체를 미루는 방식

- **특징**: 가장 단순하지만, 초기화가 오래 걸리면 서버 시작이 늦어짐

#### 1.2.3 Pre-initialization Queues (초기화 전 큐) - **권장**

컴포넌트가 초기화되기 전에 들어온 요청을 **큐(Queue)**에 쌓아두었다가, 초기화가 완료되면 큐에 쌓인 명령들을 순차적으로 실행하는 방식

- **구현 방법**: **State 패턴**을 사용하여 '초기화 중(Queuing State)'과 '초기화 완료(Ready State)'를 분리하면 깔끔하게 구현 가능
- **장점**: 클라이언트는 초기화 여부를 신경 쓰지 않고 메서드를 호출할 수 있음 (Transparent)

```javascript
class Database {
  constructor() {
    this.state = new QueuingState(this);
    this.init();
  }

  init() {
    connectToServer().then(() => {
      this.state = new ReadyState(this); // 상태 전환
      this.state.flushQueue(); // 큐에 쌓인 작업 실행
    });
  }

  query(sql) {
    return this.state.query(sql); // 현재 상태에 따라 큐잉하거나 바로 실행
  }
}
```

**State 패턴을 활용하여 초기화 복잡성을 내부로 캡슐화하는 것이 핵심**

---

## 2. Asynchronous Request Batching and Caching

### 2.1 문제 정의

고부하 애플리케이션에서 동일한 API에 대한 중복 호출이 많을 때, 불필요한 리소스 소모와 성능 저하 발생

### 2.2 해결책

#### 2.2.1 Asynchronous Request Batching (비동기 요청 배칭)

동일한 API에 대해 여러 요청이 동시에 들어올 경우, 새로운 요청을 생성하지 않고 **이미 진행 중인 요청(Promise)에 편승(piggyback)**하여 결과를 공유하는 방식

- **목적**: 중복 연산 및 I/O 호출 최소화

#### 2.2.2 Asynchronous Request Caching (비동기 요청 캐싱)

요청이 완료된 후에도 결과(Promise)를 일정 시간 동안 저장하여 재사용하는 방식

- **목적**: 응답 속도 향상 및 백엔드 부하 감소

#### 2.2.3 결합된 패턴 (Batching + Caching)

배칭과 캐싱을 결합하여 최적의 성능 달성. 진행 중인 요청은 배칭으로 처리하고, 완료된 요청은 캐싱된 값으로 처리

**주의사항: Zalgo 방지**
캐시된 값을 반환할 때도 반드시 **비동기적으로 반환**해야 함. (동기/비동기가 섞이면 예기치 않은 버그 발생)

```javascript
let cache = new Map();

function getStockPrices(item) {
  if (cache.has(item)) {
    return Promise.resolve(cache.get(item)); // 항상 비동기 반환
  }

  const promise = fetchPrices(item).then((prices) => {
    cache.set(item, prices);
    return prices;
  });

  cache.set(item, promise); // Promise 자체를 캐싱하여 배칭 효과
  return promise;
}
```

**Promise를 캐싱함으로써 배칭과 캐싱을 동시에 해결하는 것이 우아한 패턴**

---

## 3. Canceling Asynchronous Operations

### 3.1 문제 정의

사용자가 작업을 취소하거나(예: 파일 업로드 취소), 타임아웃 등으로 인해 더 이상 결과가 필요 없을 때, 진행 중인 긴 비동기 작업을 중단해야 함

### 3.2 해결책

#### 3.2.1 기본 원칙

비동기 단계 사이마다 취소 여부를 확인하고, 취소가 요청되었다면 `CancelError`와 같은 예외를 던져 작업을 중단

#### 3.2.2 Wrapper 함수

비동기 함수 호출을 감싸서 취소 로직을 자동화하는 래퍼(Wrapper)를 생성하여 사용

#### 3.2.3 Generators (Cancelable Async Flows)

제너레이터를 사용하여 `async/await`와 유사한 흐름을 유지하면서도, 외부에서 제너레이터의 흐름을 제어(취소)할 수 있는 방식

- **장점**: 코드 가독성을 `async/await` 수준으로 유지하면서도, Promise에는 없는 "외부에서의 제어권"을 가질 수 있음

```javascript
function* uploadTask() {
  try {
    yield uploadChunk(1);
    yield uploadChunk(2); // 도중에 취소되면 여기서 멈춤
  } catch (err) {
    if (err instanceof CancelError) console.log("Upload canceled");
  }
}
```

**Promise 자체는 취소 API가 표준화되어 있지 않으므로, Generator나 AbortController 등을 활용해야 함**

---

## 4. Running CPU-bound Tasks

### 4.1 문제 정의

Node.js는 **단일 스레드(Single Thread)** 기반이므로, CPU를 많이 사용하는 작업(암호화, 압축, 복잡한 계산)을 메인 스레드에서 실행하면 **이벤트 루프가 차단(Block)**되어 서버가 멈춤

### 4.2 해결책

#### 4.2.1 Interleaving with setImmediate (인터리빙)

긴 작업을 작은 단계로 쪼개고, 각 단계 사이에 `setImmediate()`를 사용하여 제어권을 이벤트 루프로 잠시 넘겨줌

- **효과**: 긴 작업 중에도 I/O 처리가 중간중간 수행될 수 있어 서버의 응답성(Responsiveness) 유지

#### 4.2.2 Child Processes (외부 프로세스)

`child_process.fork()`를 사용하여 별도의 프로세스에서 작업을 실행

- **장점**: 메인 프로세스와 완전히 분리됨
- **단점**: 프로세스 생성 비용이 높고 메모리를 많이 차지함. **프로세스 풀(Process Pool)** 사용 권장

#### 4.2.3 Worker Threads (워커 스레드) - **최신/권장**

`worker_threads` 모듈을 사용하여 스레드 기반으로 병렬 처리

- **장점**: 프로세스보다 가볍고, `SharedArrayBuffer`를 통해 메모리를 공유할 수 있어 데이터 전송 비용이 낮음
- **결론**: **CPU 집약적 작업에 가장 적합한 Node.js의 표준 방법**

---

## 결론

이 챕터는 Node.js의 비동기 특성을 유지하면서 현실적인 문제들을 해결하는 패턴을 제시함

| 패턴                     | 문제 상황                  | 해결 전략                                        |
| :----------------------- | :------------------------- | :----------------------------------------------- |
| **Async Initialization** | 초기화 덜 된 컴포넌트 사용 | **State 패턴 + Queue**로 요청 대기               |
| **Batching & Caching**   | 고부하 시 중복 요청 폭주   | **Promise 캐싱**으로 요청 병합                   |
| **Cancel Async Ops**     | 불필요한 작업 리소스 낭비  | **Generator** 또는 AbortController로 중단점 생성 |
| **CPU-bound Tasks**      | 이벤트 루프 차단 (렉 걸림) | **Worker Threads**로 작업 위임                   |

**NestJS 기반 백엔드 개발 시 고려사항:**

- **초기화:** `OnModuleInit` 등을 활용하되, 외부 의존성이 강한 경우 큐잉 패턴 고려
- **캐싱:** Interceptor 등을 활용한 요청 캐싱 및 배칭 적용
- **CPU 작업:** 이미지 처리, 엑셀 파싱 등은 반드시 Worker Thread나 별도 Microservice로 분리하여 메인 스레드 보호
