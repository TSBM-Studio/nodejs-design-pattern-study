# Chapter 11. Advanced Recipes

## 1 비동기적으로 초기화 되는 컴포넌트 다루기

많은 핵심 컴포넌트 (DB, Queue) 들은 어플리케이션이 시작되는 즉시 사용 가능한 상태가 되지 않음
네트워크 연결, 핸드셰이크, 인증 등 비동기적인 초기화 단계를 거쳐야함

네트워크 기반 컴포넌트들은 필연적으로 비동기 API를 사용해야 하므로 모듈이 로드된 시점과 실제 사용가능한 시점의 Gap이 존재

### 1.1 비동기 초기화 컴포넌트의 문제점

예를 들어 DB: 연결이 완료된 후에만 query() 를 호출 할 수 있음.
만약 import 하자마자 query() 를 호출하면, 연결이 수립되지 않았으므로 오류가 발생하거나 요청이 소실됨.

이벤트 기반 상태관리의 한계

- 단순 EventEmitter를 상속받아 connected 이벤트를 발생시키더라도 이 문제를 완벽히 해결하기 어렵다.
  - 클라이언트가 이벤트를 구독하기 전에 이미 연결이 완료되어 이벤트를 놓치거나
  - 연결이 지연되어 타임아웃이 발생하는 RaceCondition 이 발생할 수 있다.

### 1.2 지역적 초기화

매번 API를 호출할때마다 컴포넌트의 초기화 상태를 확인
만약 초기화 되지 않았다면 once('connected') 등을 이용해 초기화 이벤트가 발생할 때까지 대기 후 명령 수행

한계점: 어플리케이션 내부에서 컴포넌트의 상태를 관리해야한다. 컴포넌트 상태를 확인하는 코드가 반복적으로 작성된다.

### 1.3 지연 시작

어플리케이션의 진입점에서 비동기 컴포넌트들의 초기화를 먼저 실행하고, 이들이 완료되는것을 Pronise로 확인한 후 Listen 상태로 만든다.
구현이 간단하고 확실하다.

한계점: 초기화 시간이 긴 컴포넌트가 있다면 전체 부팅 시간이 길어진다. 서비스 운영중 재연결이 필요한 상황이나 동적으로 컴포넌트를 로드해야하는 상황에서는 유연하게 대처하기 어렵다.

- (추가) Lmabda등 서버리스 환경에서 사용하면 유용할 것 같다.

### 1.4 지연 초기화 큐

컴포넌트가 초기화 되지 않은 상태에서 들어온 요청을 내부 큐에 임시로 저장해 두었다가 초기화가 완료되는 순간 일괄 처리

Command Pattern

- 클라이언트의 요청은 커맨드 객체로 캡슐화 되어 commandQueue에 저장, 클라이언트에는 Promise를 리턴

State Pattern

- 컴포넌트는 내부적으로 2개의 상태를 가짐
  - Queuing: 초기화 전, 이 상태에서 호출되는 모든 메서드는 비즈니스 로직을 실행하지 않고, 작업을 큐에 적재
  - Initialized: 초기화가 완료된 후의 상태

컴포넌트가 연결돠는 순간, 컴포넌트는 Queuing -> InitializedState로 상태 구현체를 교체, 큐에 쌓여있던 모든 커맨드를 Drain

- 클라이언트가 컴포넌트의 초기화 여부를 몰라도 됨.
- 코드의 목잡성을 컴포넌트 내부로 캡슐화

### 1.5 현업 사례

Mongoose
pg

#### 다른것들은? (TypeORM, MikroORM)

TypeORM: 지연시작 (명시적 초기화 필요)

```ts
import { DataSource } from 'typeorm'

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'user',
  password: 'password',
  database: 'mydb',
  entities: [User, Post],
})

// 명시적 초기화 필요
await AppDataSource.initialize()

// 이후에만 사용 가능
const userRepo = AppDataSource.getRepository(User)
await userRepo.find()
```

MikroORM: 지연 초기화 큐(Lazy Initialization Queue) + 지연 시작 혼합

```ts
// 방법 1: 명시적 초기화 대기 (지연 시작)
const orm = await MikroORM.init({...})
app.listen(3000)

// 방법 2: 지연 초기화 (내부 큐잉)
const orm = MikroORM.init({...})  // await 없음
app.listen(3000)  // 먼저 시작

// ORM이 초기화 되면 자동으로 큐에 쌓인 쿼리 실행
```

무슨 장점이 있는거지..?

1. 서버리스 환경: 초기화 시간을 아껴서 Lambda 비용절약
2. 부팅 시간: 여러 외부 의존성이 동시에 시작되어야 하는 경우 (lazy init으로 시작하여 즉시 서버 시작)
3. 개발편의성: hot reload

추가적인 예시: Socket.IO

```ts
import { Server } from 'socket.io'

const io = new Server(3000)

// 서버 시작 전에 리스너 등록 가능
io.on('connection', (socket) => {
  socket.on('message', (msg) => {
    console.log(msg)
  })
})

// 내부적으로 연결 대기 큐 관리
// 서버가 준비되면 자동으로 처리
```

(lamdba가 하루에 수억건씩 올라가서 그 비용을 줄여야 하는게 아니라면)
개인적인 생각으로는 얻는 장점에 비해 에러처리나 디버깅의 복잡함이 더 큰 것 같다..

#### 분산환경에서는?

분산환경에서는 큐를 외부에 두어야 하나..?
Mongoose와 pg는 관련 옵션은 지원하지 않는걸로 보인다.

---

## 2 비동기 요청 일괄처리 및 캐싱

동일한 비동기 작업이 중복으로 요청될 때 이를 최적화 하기 위해 일괄처리와 캐싱을 도입한다.

### 2.1 비동기 요청 일괄처리

동일한 API에 대해 여러 요청이 동시에 발생했을때, 이를 하나의 작업으로 묶어서 처리한다.

일반 시나리오

1. 클라이언트 A와 클라이언트 B가 동시에 `totalSales('book')` 비동기 함수 호출
2. 2번의 DB 쿼리가 발생

일괄 처리 시나리오

1. 클라이언트 A의 요청으로 비동기 작업이 시작되었지만 완료되지 않은 상태
2. 클라이언트 B의 요청 수신
3. 클라이언트 B의 요청에 의해 새로운 DB 쿼리를 실행하는대신, 이미 실행중인 클라이언트 A의 작업을 클라이언트 B에도 반환.
-> 동일한 결과 받음

### 2.2 최적의 비동기 요청 캐싱

동일한 API에 대해 시간차를 두고 동일한 요청이 발생했을때, 캐싱을 통해 성능을 최적화 한다. 비동기 요청 일괄처리와 통합하여 성능을 최적화 할 수 있다.

요청이 완료된 후 결과를 캐시에 저장하는 방식만 사용하면, 캐시가 설정되기 전에 들어오는 중복 요청들은 방어하지 못한다.

비동기 요청에 대한 캐싱 시나리오

1. 캐시 확인: 유효한 데이터가 있는지 확인
2. 일괄 처리 확인: 캐시가 없다면 현재 진행중인 동일한 작업(Promise) 가 있는지 확인 후 그것을 반환
3. 실행 및 저장: 둘다 없다면 작업을 실행하고 그 결과(Promise)를 맵에 저장하여 이후 요청들이 공유한다. 작업이 완료되면 캐싱한다.

### 2.3 캐싱이나 일괄처리가 없는 API 서버

순차처리한다.

### 2.4 프로미스를 이용한 일괄 처리 및 캐싱

### 2.5 총 판매 웹서버에서의 요청 일괄 처리

```ts
const requests = new Map<string, Promise>()

export function totalSales(product) {
    if(requests.has(product.id)) {
        return requests.get(product.id)
    }

    const resultPromise = totalSalesRaw(product)

    requests.set(product.id, resultPromise)

    resultPromise.finally(() => {
        requests.delete(product.id)
    })

    return resultPromise
}
```

### 2.6 총 판매 웹서버에서의 요청 캐싱

promise가 완료된 후에도 requests를 일정 시간동안 Map 항목에 추가해두면 된다.

```ts
const CACHE_TTL = 30 * 1000;
const requests = new Map<string, Promise>()

export function totalSales(product) {
    if(requests.has(product.id)) {
        return requests.get(product.id)
    }

    const resultPromise = totalSalesRaw(product)
    requests.set(product.id, resultPromise)

    resultPromise
        .then(() => {
            setTimeout(() => {
                cache.delete(product.id)
            }, CACHE_TTL)
        }, err => {
            cache.delete(product.id)
            throw err
        })


    return resultPromise
}
```

### 2.7 캐싱 메커니즘 구현에 대한 참고사항

- 메모리 관리: Map 객체는 크기 제한이 없으므로 무한으로 캐시가 늘어나 OOM이 발생하는것에 대한 관리가 필요 (LRU등의 캐싱 알고리즘 적용)
- 분산 환경: 야러 Node.js 프로세스가 실행되는 클러스터 환경이나 분산서버 환경에서는 로컬 메모리 캐시가 각 프로세스마다 다르게 유지되어 데이터 불일피가 발생할 수 있다. -> Redis, Memcache등 공유 저장소 사용
- 캐시 무효화: 데이터가 변경되었을때 캐시를 지우는 전략을 구현해야한다.

#### 예시

DataLoader: GraphQL과 같이 사용하는 라이브러리

---

## 3 비동기 작업 취소

비동기 작업은 실행 시간이 길어질 수 있으며, 그 사이 필요없어질 수 있다.  
불필요해진 비동기 작업을 계속 수행하는 것은 CPU와 네트워크 리소스를 낭비하는 일.
Node.js의 Promise는 기본적으로 취소 불가능(uncancelable)하므로, 이를 구현하기 위해서는 별도의 패턴이 필요.

### 3.1 취소하능한 함수를 만드는 기본 레시피

취소 상태를 담은 객체(Token)를 비동기 함수에 인자로 전달하는 것

동작 방식:

  1. cancelObj라는 객체를 생성하고 cancelRequested 프로퍼티를 false로 설정.
  2. 비동기 함수는 실행 중간중간(주로 await 직후)에 이 프로퍼티가 true인지 확인, true라면 CancelError와 같은 특수 예외를 던져 실행을 중단

한계: 비동기 작업이 완료되어 제어권이 돌아온 시점에만 취소 여부를 확인할 수 있다는 한계

### 3.2 비동기 호출 래핑

비즈니스 로직 내부에 if (cancelRequested)...와 같은 코드가 산재해 있으면 가독성이 떨어짐. 이를 개선하기 위해 래퍼(Wrapper) 패턴을 사용

구현: createCancelWrapper와 같은 팩토리 함수를 사용하여, 취소 상태 관리 로직을 캡슐화. 이 래퍼는 비동기 함수를 호출할 때마다 현재 취소 상태를 확인하고, 취소되었다면 원래의 Promise 대신 거부(Reject)된 Promise를 반환. 이를 통해 취소 로직을 비즈니스 로직에서 분리.

#### ????

3.1, 3.2 방법은 결국 비동기의 제어권이 어플리케이션에 돌아온 후에야 취소 처리를 할 수 있다. 그럼 취소하나 성공하나 명시적인 차이만 있고 아무 차이없는거 아닌가..?

### 3.3 제너레이터를 이용한 취소 가능한 비동기 함수

async/await 문법은 내부적으로 Promise와 제너레이터의 조합으로 동작하지만, 개발자가 제어 흐름에 개입할 수 없음.
반면, 제너레이터(function*)를 직접 사용하면 실행을 일시 중지(yield)하고 재개(next)하는 과정을 커스터마이징할 수 있어, 가장 강력하고 유연한 취소 메커니즘을 구현할 수 있음.

```js
// 1. 커스텀 실행기 - 제너레이터의 각 yield 지점에서 취소 체크
function asyncRun(generator, cancelToken) {
  function step(value) {
    // yield마다 취소 확인 (비동기 작업 중에도 체크 가능!)
    if (cancelToken.cancelled) {
      return Promise.reject(new Error('Cancelled'))
    }
    
    const result = generator.next(value)
    
    if (result.done) {
      return Promise.resolve(result.value)
    }
    
    // yield된 Promise가 완료되면 다음 step 실행
    return result.value.then(val => step(val))
  }
  
  return step()
}

// 2. 제너레이터 함수 - async/await과 유사하지만 yield 사용
function* downloadTask() {
  console.log('Step 1: 파일 정보 가져오기...')
  const fileInfo = yield getFileInfo()  // 1초 소요
  
  console.log('Step 2: 파일 다운로드...')
  const file = yield downloadFile(fileInfo)  // 5초 소요
  
  console.log('Step 3: 파일 처리...')
  const result = yield processFile(file)  // 3초 소요
  
  return result
}

// 3. 사용 예시
const cancelToken = { cancelled: false }
const task = asyncRun(downloadTask(), cancelToken)

// 2초 후 취소 - Step 2 다운로드가 완료되면 바로 취소됨!
setTimeout(() => {
  cancelToken.cancelled = true
  console.log('작업 취소')
}, 2000)

task.catch(err => console.log('결과:', err.message))
```

#### 3.1, 3.2 방식과의 차이점

```js
// 기존 방식 (3.1, 3.2): await 사이에만 취소 체크
async function oldWay(cancelToken) {
  const data = await longTask()  // 10초 작업 중에는 취소 불가
  if (cancelToken.cancelled) throw new Error('Cancelled')  // 10초 후에야 체크
  return data
}

// 제너레이터 방식 (3.3): yield마다 실행기가 취소 체크
function* newWay() {
  const data = yield longTask()  // 실행기가 완료 직후 즉시 취소 체크!
  return data
}
```

정리:

- async/await: Promise가 완료되어야만 다음 코드 실행 → 취소 체크도 그때 가능
- 제너레이터: 실행기가 각 `yield` 지점을 제어 → Promise 완료 직후 취소 체크 가능
- 장점: 비동기 작업들 사이사이에서 더 빠르게 취소 가능, 로직과 제어 분리

여러 비동기 작업이 묶여있을때 각 단계별로 yield 구문을 통하여 각각의 작업 이후에 취소시킬 수 있다

### 커스텀 실행기 구현

createAsyncCancelable(generatorFunction) 고차 함수입니다.

- 제어권 확보: 이 함수는 제너레이터를 실행하는 '실행기(Runner)' 역할. 제너레이터가 yield를 통해 Promise를 반환할 때마다, 실행기는 이 Promise의 완료를 기다림.
- 상태 주입: Promise가 완료되어 next()를 호출하기 전에, 실행기는 현재 취소 상태를 확인, 만약 취소가 요청되었다면 next() 대신 throw()를 호출하여 제너레이터 내부에서 예외를 발생시키거나, 아예 next()를 호출하지 않고 Promise를 거부(Reject)하여 실행을 즉시 중단.
- 투명성: 개발자는 async/await와 거의 유사한 문법(function*과 yield)으로 코드를 작성하면서도, 외부에서 언제든지 실행을 중단시킬 수 있는 권한을 갖게 됨.

```js
// 제너레이터 기반 커스텀 실행기
function createAsyncCancelable(generatorFn) {
  return function(cancelToken) {
    const generator = generatorFn()
    
    function step(value) {
      // 1: yield 지점마다 취소 확인
      if (cancelToken.cancelled) {
        return Promise.reject(new Error('Cancelled'))
      }
      
      // 2: 제너레이터 다음 단계 실행
      const result = generator.next(value)
      
      if (result.done) {
        return Promise.resolve(result.value)
      }
      
      // 3: Promise 완료 후 재귀적으로 다음 step 호출
      return result.value.then(val => step(val))
    }
    
    return step()
  }
}

// 사용 예시
const downloadWithRetry = createAsyncCancelable(function* () {
  console.log('1단계: 서버 연결...')
  yield connect()
  
  console.log('2단계: 파일 다운로드...')
  const file = yield download()
  
  console.log('3단계: 검증...')
  yield validate(file)
  
  return file
})

const cancelToken = { cancelled: false }
const task = downloadWithRetry(cancelToken)

// 언제든지 취소 가능 (1초 지난후 현재 실행중인 비동기 작업까지만 실행하고 취소)
setTimeout(() => cancelToken.cancelled = true, 1000)
```

### AbortController vs 제너레이터 방식 비교

#### 1. AbortController 방식 (표준)

```js
// 장점: 표준 API, fetch 등 네이티브 지원
async function downloadWithAbort(signal) {
  // ✅ fetch는 AbortController 내장 지원
  const response = await fetch(url, { signal })
  
  // 하지만 커스텀 비동기 작업은 수동으로 체크 필요
  if (signal.aborted) throw new Error('Aborted')
  const data = await processData(response)
  
  if (signal.aborted) throw new Error('Aborted')
  return data
}

// 사용
const controller = new AbortController()
downloadWithAbort(controller.signal)

setTimeout(() => controller.abort(), 1000)
```

- 웹 표준, fetch/DOM API와 네이티브 통합
- 이벤트 기반 (`signal.addEventListener('abort', ...)`)
- 커스텀 로직에서는 여전히 수동 체크 필요
- 복잡한 흐름 제어 시 코드가 산재됨

#### 2. 제너레이터 방식 (커스텀 실행기)

```js
// 실행기가 자동으로 모든 yield 지점에서 취소 체크
const downloadWithGenerator = createAsyncCancelable(function* () {
  const response = yield fetch(url)       // 자동 취소 체크
  const data = yield processData(response) // 자동 취소 체크
  return data                              // 자동 취소 체크
})

// 사용
const cancelToken = { cancelled: false }
downloadWithGenerator(cancelToken)

setTimeout(() => cancelToken.cancelled = true, 1000)
```

특징:

- 취소 로직이 실행기에 캡슐화됨 (비즈니스 로직 깔끔)
- 모든 yield 지점에서 자동 취소 체크
- 추가 기능 확장 쉬움 (재시도, 로깅, 타임아웃 등)
- 비표준, 직접 구현 필요 (또는 라이브러리 사용)
- 제너레이터 문법에 익숙해야 함

AbortController를 사용하는 경우:

- fetch, DOM 이벤트 등 네이티브 API 취소
- 단순한 비동기 작업 취소
- 브라우저 호환성이 중요한 경우
- 표준을 따르고 싶은 경우

제너레이터 방식을 사용하는 경우:

- 복잡한 비즈니스 로직 (여러 단계의 비동기 작업)
- 취소 외 추가 기능 필요 (재시도, 타임아웃, 로깅 등)
- 취소 로직을 비즈니스 로직에서 완전히 분리하고 싶은 경우

## 4 CPU bound 작업 실행

Node.js는 단일 스레드 기반의 이벤트 루프 모델을 따르기 때문에, I/O 작업이 아닌 CPU 연산이 주를 이루는 작업(CPU-bound tasks)을 메인 스레드에서 실행하면 이벤트루프가 차단된다.

### 4.1 부분 집합 문제 해결하기

CPU 집약적 작업을 메인 스레드에서 동기적으로 실행하면 이벤트 루프가 차단되어 서버가 응답하지 않는 문제 발생

```ts
// Subset Sum - O(2^n)
function subsetSum(numbers, target) {
  const combinations = 2 ** numbers.length
  
  for (let i = 0; i < combinations; i++) {
    // 복잡한 계산...
  }
  
  return { found: true, subset: [1, 2, 3] }
}

app.get('/compute', (req, res) => {
  console.log('Computing subset sum...')
  
  // 이 작업이 모두 끝날때까지 서버는 아무것도 못함
  const result = subsetSum([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0) 
  
  res.json({ result })
})
```

### 4.2 setImmediate를 이용한 interleaving

긴 작업을 여러 작은 단계로 쪼개고, 각 단계 사이에 setImmediate를 사용하여 제어권을 이벤트 루프에 양보.

```ts
// setImmediate로 작업 쪼개기 - 이벤트 루프 양보
function subsetSumAsync(numbers, target, callback) {
  const combinations = 2 ** numbers.length
  const CHUNK_SIZE = 1000 // 한 번에 처리할 작업량
  
  let i = 0
  
  function processChunk() {
    // 작은 단위만큼만 작업 수행
    const end = Math.min(i + CHUNK_SIZE, combinations)
    
    for (; i < end; i++) {
      // 복잡한 계산...
    }
    
    // 아직 작업이 남았으면
    if (i < combinations) {
      // setImmediate로 다음 단계 예약 -> 이벤트 루프가 다른 요청을 처리할 수 있음!
      setImmediate(processChunk)
    } else {
      // 모든 작업 완료
      callback({ found: true, subset: [1, 2, 3] })
    }
  }
  
  processChunk() // 시작
}

app.get('/compute-sync', (req, res) => {
  const result = subsetSumSync([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0)
  res.json({ result })
})

```

장점:

- 서버 반응성(Responsiveness) 유지
- 다른 요청들을 처리할 수 있음
- 코드 수정만으로 구현 가능

한계:

- 전체 실행 시간은 오히려 증가 (컨텍스트 스위칭 오버헤드)
- 알고리즘을 비동기 스타일로 재작성해야 함
- `process.nextTick` 사용 시 여전히 I/O 기아 상태 발생 가능

주의: `process.nextTick`은 I/O 이벤트 이전에 실행되므로 사용하면 안 됨! 반드시 `setImmediate` 사용

### 4.3 외부 프로세스 사용

child_process.fork()를 사용하면 별도의 프로세스를 생성하여 작업을 위임.

메인 프로세스는 웹 서버 역할만 수행하고, 무거운 연산은 자식 프로세스(Worker)에게 메시지(send)로 전달, 자식 프로세스는 연산을 수행한 후 결과만 메시지로 반환.
메인 이벤트 루프가 전혀 차단되지 않으며, 멀티 코어 CPU의 자원을 활용할 수 있음.

프로세스를 생성하고 띄우는것(spawn) 은 비싼 작업. 요청이 올때마다 만들고 정리하기 보다는 미리 일정수의 프로세스를 만들고 사용하는 프로세스 풀 패턴을 구현해야 오버헤드를 줄일 수 있다.

일반적으로 프로세스간의 동기화가 필요한 작업은 불가능할듯?

### 4.4 워커 스레드 사용

프로세스와의 차이점:

- 메모리 공유: 자식 프로세스는 완전히 독립된 메모리 공간을 가지지만, 워커 스레드는 SharedArrayBuffer를 통해 메모리를 공유할 수 있어 데이터 전송 비용을 줄일 수 있음.
- 경량성: 프로세스보다 생성 비용이 낮고 컨텍스트 스위칭 비용도 적음.
- 구현: child_process와 API가 매우 유사. process.send/on 대신 parentPort.postMessage/on을 사용하며, 메인 스레드와 워커 간의 통신을 처리.

이거쓰자.

### 실제 사용

- sharp
- Jimp
- pdf-kit
- bcrypt