# Deep Dive: Canceling Asynchronous Operations

### 핵심 내용

Node.js의 비동기 작업은 기본적으로 **"실행하면 끝까지 간다(Fire-and-Forget)"**는 특성이 있음.
중간에 취소하기 위해서는 **"외부에서 제어 가능한 흐름"**을 만들어야 함.

- **Promise의 한계:** 표준 Promise API에는 `cancel()`이 없음
- **Generator 활용:** `yield`를 통해 실행 제어권을 호출자에게 위임하여 취소 가능하게 함
- **AbortController:** 최신 표준 API로, `signal`을 통해 취소 이벤트를 전파함

---

## 1. The Problem: Promise는 멈추지 않는다

일반적인 비동기 함수는 한 번 호출되면 멈출 수 없음.

```javascript
async function upload() {
  await step1();
  // <-- 여기서 사용자가 "취소" 버튼을 눌러도
  await step2(); // <-- 이 코드는 실행됨 (자원 낭비)
  await step3();
}
```

### 왜 문제인가?
1. **리소스 낭비:** 결과가 필요 없는데도 CPU와 네트워크를 계속 사용함
2. **부작용(Side Effect):** 이미 페이지를 벗어났는데 뒤늦게 UI 업데이트를 시도하다 에러 발생 (React의 "Can't perform a React state update on an unmounted component" 경고)

---

## 2. Generator를 활용한 제어권 역전 (Inversion of Control)

Generator 함수(`function*`)는 `yield`를 만날 때마다 멈추고 제어권을 외부(Caller)로 넘김.
이를 이용하면 **"다음 단계로 넘어갈지, 아니면 멈출지"**를 외부에서 결정할 수 있음.

### 2.1 기본 구조

```javascript
function* task() {
  console.log('Step 1');
  yield 1;
  
  console.log('Step 2');
  yield 2;
  
  console.log('Step 3');
}

const iterator = task();
iterator.next(); // Step 1
// 여기서 멈춤. iterator.next()를 안 부르면 Step 2는 영원히 실행 안 됨.
```

### 2.2 Cancelable Async Runner 구현

Promise와 Generator를 결합하여 **"취소 가능한 async/await"**를 구현하는 패턴.

```javascript
class CancelError extends Error {
  constructor() { super('Canceled'); this.isCanceled = true; }
}

function createAsyncRunner(generatorFn) {
  return function (...args) {
    const generator = generatorFn(...args);
    let cancelRequested = false;

    // 1. 실행을 담당하는 Promise 반환
    const promise = new Promise((resolve, reject) => {
      
      // 재귀적으로 next()를 호출하는 함수
      function handleNext(result) {
        if (cancelRequested) {
          return reject(new CancelError());
        }

        if (result.done) {
          return resolve(result.value);
        }

        // yield된 Promise가 완료되면 다시 handleNext 호출
        Promise.resolve(result.value)
          .then(res => handleNext(generator.next(res)))
          .catch(err => {
            if (cancelRequested) reject(new CancelError());
            else handleNext(generator.throw(err));
          });
      }

      handleNext(generator.next());
    });

    // 2. 취소 메서드 부착 (핵심)
    promise.cancel = () => {
      cancelRequested = true;
    };

    return promise;
  };
}
```

### 2.3 사용 예시

```javascript
const cancelableUpload = createAsyncRunner(function* (files) {
  console.log('Start Uploading...');
  
  for (const file of files) {
    // 여기서 yield가 중단점 역할
    yield uploadFile(file); 
    console.log(`${file} uploaded`);
  }
  
  return 'All Done';
});

// 실행
const work = cancelableUpload(['a.png', 'b.png']);

// 도중에 취소!
setTimeout(() => {
  work.cancel();
  console.log('Cancel Requested!');
}, 100);

work.catch(err => {
  if (err instanceof CancelError) console.log('Work Canceled Cleanly');
  else console.error(err);
});
```

---

## 3. Modern Alternative: AbortController

Generator 패턴은 학습용으로는 훌륭하지만(원리 이해), 최신 Node.js/Web 환경에서는 **AbortController**가 표준.

### 3.1 AbortController란?
Fetch API와 함께 도입된 취소 시그널 표준.

```javascript
const controller = new AbortController();
const signal = controller.signal;

// 1. 비동기 작업에 signal 전달
doHeavyWork({ signal }).then(() => console.log('Done')).catch(console.error);

// 2. 취소 호출
controller.abort(); 

// --- 구현부 ---
async function doHeavyWork({ signal }) {
  if (signal.aborted) throw new Error('Aborted');

  await step1();
  
  // 중간중간 체크 or 리스너 등록
  if (signal.aborted) throw new Error('Aborted');
  
  // Node.js 스트림이나 fetch에는 signal을 그대로 전달 가능
  await fetch('https://example.com', { signal });
}
```

---

## 결론

**언제 무엇을 써야 할까?**

1. **라이브러리/프레임워크 개발자라면:** Generator 기반의 Custom Runner가 제어권 확보에 유리할 수 있음 (Redux-Saga가 이 방식 사용)
2. **일반 애플리케이션 개발자라면:** 표준인 **AbortController** 사용 권장.

**NestJS 적용 포인트**

*   HTTP 요청 취소 시 (`req.on('close')`), `AbortSignal`을 서비스 계층까지 전파하여 DB 쿼리나 외부 API 호출도 같이 취소되게 설계해야 진정한 리소스 절약이 가능함.

