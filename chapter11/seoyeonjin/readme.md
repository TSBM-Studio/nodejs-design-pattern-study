## [11-1 비동기적으로 초기화되는 컴포넌트 다루기]

초기화가 빠르게 끝나는 경우 → 동기 API 사용해도 괜찮다.

초기화에 네트워크가 필요하거나 시간이 오래 걸리는 경우 → 반드시 비동기 API 사용해야 한다.

- Node.js는 싱글 스레드라 동기식 네트워크 호출을 하면 전체 스레드가 멈춘다.
- 데이터베이스 드라이버(RabbitMQ, DB 드라이버 등)는 초기화를 비동기로 제공한다.

### 11-1-1 비동기적으로 초기화된 컴포넌트의 문제

DB처럼 초기화가 비동기인 컴포넌트는 초기화가 완료되기 전에는 사용하면 안 되므로 특별한 처리가 필요하다. → 로컬 초기화 확인, 지연 시작

- 로컬 초기화 확인

API가 호출되기 전에 모듈이 초기화되었는지 확인, 그렇지 않으면 초기화 기다린다.

비동기 모듈에서 작업을 호출할 때마다 수행해야 한다.

- 지연 시작

초기화가 완료될 때까지 비동기적으로 초기화된 컴포넌트에 의존하는 코드의 실행을 지연시킨다.

모든 비동기 서비스가 초기화될 때까지 전체 프로그램 시작을 지연시킬 수도 있다.

→ 지연 문제가 발생할 수 있다.

### 11-1-2 사전 초기화 큐

`큐와 명령 패턴`: 아직 초기화되지 않았다면 큐에 넣은 다음 모든 초기화 단계가 완료되는 즉시 실행한다.

- **QueuingState (초기화 전 상태)**
  - DB가 아직 연결 안 됐을 때
  - `query()` 호출 시 **바로 실행하지 않고 큐에 저장**
  - 나중에 초기화가 완료되면 큐에 쌓인 명령을 실행함
- **InitializedState (초기화 완료 상태)**
  - DB가 완전히 준비된 후
  - `query()`를 즉시 실행

```jsx
const METHODS_REQUIRING_CONNECTION = ['query']
const deactivate = Symbol('deactivate')

class QueuingState {
  constructor(db) {
    this.db = db
    this.commandsQueue = []
  }

  // query 메서드를 동적으로 만든다
  METHODS_REQUIRING_CONNECTION.forEach(methodName => {
    this[methodName] = function (...args) {
      console.log('Command queued:', methodName, args)

      return new Promise((resolve, reject) => {

        const command = () => {
          db[methodName](...args)
            .then(resolve, reject)
        }

        this.commandsQueue.push(command)
      })
    }
  })

  [deactivate]() {
    this.commandsQueue.forEach(command => command())
    this.commandsQueue = []
  }
}

```

## [11-2 비동기식 요청 일괄 처리 및 캐싱]

### 11-2-1 비동기식 요청 일괄 처리란?

같은 API에 대한 비동기 요청이 동시에 여러 개 들어오면, 새로운 요청을 또 실행하지 않고 이미 실행 중인 요청에 “얹어서(piggyback)” 같이 처리한다.

### 11-2-2 최적의 비동기 요청 캐싱

요청 완료 → 결과 캐시에 저장 → API가 호출될 때 캐시에서 결과 검색

### 11-2-3 캐싱 혹은 일괄 처리가 없는 API 서버

예제

- DB 전체(100,000개)를 처음부터 끝까지 스캔
- product가 일치하면 amount 더함
- 결과 반환

→ 요청이 한 번 올 때마다 DB를 전체 스캔함 (비효율적)

```jsx
export async function totalSales(product) {
  const now = Date.now();
  let sum = 0;

  for await (const transaction of salesDb.createValueStream()) {
    if (!product || transaction.product === product) {
      sum += transaction.amount;
    }
  }

  console.log(`totalSales() took: ${Date.now() - now}ms`);
  return sum;
}
```

### 11-2-4 Promise를 사용한 일괄 처리 및 캐싱

예제 - 일괄 처리

- 요청(product)을 key로 저장하는 Map 준비
- 이미 진행 중인 요청이 있으면 → 그 Promise 그대로 반환
- 없다면 → 새로 totalSalesRaw(product)를 실행하고 Map에 저장
- Promise가 끝나면 Map에서 제거

```jsx
if (runningRequests.has(product)) {
  return runningRequests.get(product); // 이미 진행 중인 작업에 얹기
}

const resultPromise = totalSalesRaw(product);
runningRequests.set(product, resultPromise);

resultPromise.finally(() => {
  runningRequests.delete(product); // 끝나면 제거
});

return resultPromise;
```

예제 - 캐싱

- `cache.has(product)` → 캐시 히트라면 바로 반환
- 없다면 totalSalesRaw 실행 후 Promise를 캐시에 저장
- TTL이 지나면 캐시 삭제

```jsx
if (cache.has(product)) {
  return cache.get(product);
}

const resultPromise = totalSalesRaw(product);
cache.set(product, resultPromise);

resultPromise.then(() => {
  setTimeout(() => cache.delete(product), CACHE_TTL);
});
```

## [11-3 비동기 작업 취소]

JavaScript/Node.js는 단일 스레드이며, 이미 실행 중인 비동기 작업은 **중간에 강제로 끊을 수 없다.**

**→ 취소 작업을 위해서는 취소 요청이 들어왔는지 확인하고, 들어왔다면 멈추는 로직을 추가해야 한다.**

### 11-3-1 취소 가능한 함수를 만들기 위한 기본 레시피

함수 실행 취소: 작업 취소가 요청되었는지 확인하고, 작업을 조기 종료한다.

```jsx
async function cancelable(cancelObj) {
  const resA = await asyncRoutine("A");

  if (cancelObj.cancelRequested) throw new CancelError();

  const resB = await asyncRoutine("B");

  if (cancelObj.cancelRequested) throw new CancelError();

  const resC = await asyncRoutine("C");
}
```

- 비동기 구간마다 **cancelRequested**를 검사
- 호출부에서 `cancelObj.cancelRequested = true` 하면 함수는 다음 체크 시점에 멈춘다.

### 11-3-2 비동기 호출 래핑

취소 로직을 wrapping하여 코드 중복을 제거한다.

```jsx
const { cancelWrapper, cancel } = createCancelWrapper();
```

- 실제 async 함수 호출보다 **앞에서 취소되었는지 체크**
- 취소되었다면 Promise.reject(CancelError)

### 11-3-3 제너레이터를 사용한 취소 가능한 비동기 함수

제너레이터는 실행을 'yield 단위'로 끊을 수 있다.

이 특성을 활용하면 비동기 작업을 단계별로 멈추거나 다시 진행시킬 수 있고, 각 단계 사이에서 취소 요청이 들어왔는지를 검사해 흐름을 안전하게 중단할 수 있다.

```jsx
function* task() {
  const a = yield asyncRoutine("A");
  const b = yield asyncRoutine("B");
  const c = yield asyncRoutine("C");
  return c;
}
```

- 제너레이터 호출 & nextStep 호출

```jsx
generatorObject.next();

nextStep(generatorObject.next(await prev.value));
```

- 취소 시

```jsx
if (cancelRequested) {
  return reject(new CancelError());
}
```

## [11-4 CPU 바운드 작업 실행]

CPU 바운딩: 프로그램의 실행 속도를 결정하는 가장 큰 요인이 **CPU 연산량**일 때

### 11-4-1 부분집합 합계 문제 풀기

Node.js 이벤트루프는 단일 스레드에서 실행되며, CPU 연산량이 많은 작업을 처리하는 중에 다른 요청을 처리하지 못한다.

### 11-4-2 setImmediate를 사용한 인터리빙

- CPU 바인딩 알고리즘은 일련의 단계로 이루어져 있다.
- 각 단계가 완료된 후에 이벤트 루프에 제어권을 되돌린다.

→ 보류중인 I/O 요청 후 실행되도록 알고리즘의 다음 단계를 예약한다.

`before`

```jsx
_combine(set, subset) {
  for (...) {
    const newSubset = ...
    this._combine(...)
    this._processSubset(...)
  }
}

```

`after`

```jsx
_combineInterleaved(set, subset) {
  this.runningCombine++

  setImmediate(() => {
    this._combine(set, subset)
    if (--this.runningCombine === 0) {
      this.emit('end')
    }
  })
}
```

- `_combineInterleaved()`가 먼저 실행됨
- 즉시 `_combine()`을 실행하지 않음
- 대신 `setImmediate()`로 예약
- 이벤트 루프가 다른 요청 처리 가능
- 다시 돌아오면 `_combine()` 한 덩어리 처리
- 또 setImmediate() 예약
- 반복…

- 고려사항
  - 각 단계를 실행하는데 오랜 시간이 걸리면 잘 작동하지 않는다.

### 11-4-3 외부 프로세스의 사용

`자식 프로세스 사용`: fork()를 통해 새로운 Node.js 프로세스(자식 프로세스)를 띄워서 CPU 바운드 연산을 대신 처리하게 만드는 방법.

- 전체 구조

  1.  메인 프로세스
      - HTTP 요청을 받는다
      - 부분집합 합계(subset sum) 작업을 자식 프로세스에게 위임한다
      - 자식 프로세스로부터 도착하는 `{ event: 'match' | 'end', data }` 메시지를 받아 클라이언트에 전송한다
  2.  ProcessPool (프로세스 풀)
      - 자식 프로세스를 여러 개 띄워놓고 재사용하는 구조

- acquire() 함수
  - **pool에 놀고 있는 프로세스가 있으면 바로 빌려줌**
  - **현재 active가 max라면 → waiting 큐에 resolve/reject 저장**
  - **새 프로세스를 fork()해서 준비되면(resolve) 빌려줌**
- release() 함수
  - 작업 끝난 worker를 원래 자리로 돌려놓는 함수.
- SubsetSumFork 클래스
  - 실제 작업을 넘기는 클래스
- 자식 프로세스(SubsetSumProcessWorker)
  - 부모로부터 `{ sum, set }` 메시지를 받는다
  - 메시지를 받으면 실제 SubsetSum 알고리즘 실행
  - match가 나오면 `{ event: 'match', data }` 메시지 전송
  - 끝나면 `{ event: 'end', data }` 전송
  - 준비되면 `process.send('ready')`

### 11-4-4 작업자 스레드(worker threads) 사용

- 작업자 스레드
  - Node 10.5.0 부터 도입 가능
  - 프로세스에 비해 메모리 공간이 더 작고 시작 시간이 빠르다.
  - 같은 프로세스 안에 있지만, 서로 다른 스레드에서 실행
  - 각 워커 스레드는
    - 자기만의 **이벤트 루프**
    - 자기만의 **V8 인스턴스 & 힙을** 가짐
  - 메인 스레드와는 메시지(postMessage) 기반으로 통신
  - 필요하면 `SharedArrayBuffer + Atomics`로 메모리를 공유할 수도 있음

```jsx
import { Worker } from "worker_threads";

export class ThreadPool {
  constructor(file, poolMax) {
    this.file = file; // 워커 스크립트 경로
    this.poolMax = poolMax; // 최대 워커 수
    this.pool = []; // 놀고 있는 워커들
    this.active = []; // 일하는 워커들
    this.waiting = []; // 워커 없어서 기다리는 요청들
  }

  acquire() {
    return new Promise((resolve, reject) => {
      let worker;

      // 1) 놀고 있는 워커 있으면 꺼내서 바로 줌
      if (this.pool.length > 0) {
        worker = this.pool.pop();
        this.active.push(worker);
        return resolve(worker);
      }

      // 2) 이미 풀 최대치만큼 바쁘면 대기열에 넣음
      if (this.active.length >= this.poolMax) {
        return this.waiting.push({ resolve, reject });
      }

      // 3) 새 워커 생성
      worker = new Worker(this.file);
      worker.once("online", () => {
        // 워커 준비 완료
        this.active.push(worker);
        resolve(worker);
      });

      worker.once("exit", (code) => {
        console.log(`Worker exited with code ${code}`);
        this.active = this.active.filter((w) => w !== worker);
        this.pool = this.pool.filter((w) => w !== worker);
      });
    });
  }

  release(worker) {
    // 대기중인 요청이 있으면 걔부터 깨워줌
    if (this.waiting.length > 0) {
      const { resolve } = this.waiting.shift();
      return resolve(worker);
    }

    // 아니면 워커를 active에서 빼고 pool에 넣어 재사용
    this.active = this.active.filter((w) => w !== worker);
    this.pool.push(worker);
  }
}
```
