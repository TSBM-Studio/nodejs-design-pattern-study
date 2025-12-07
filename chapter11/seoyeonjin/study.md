# pg, mongoose, redis의 초기화 전략 비교

## 1. 패키지의 초기화 전략

| 패키지             | 실행 시점                     | 초기화 전 실행 | 실패 처리              | 큐 전략                | lazy 의미                  |
| ------------------ | ----------------------------- | -------------- | ---------------------- | ---------------------- | -------------------------- |
| **pg**             | 즉시 실행                     | 불가           | 실패                   | 개발자가 직접 큐       | lazy 없음                  |
| **mongoose**       | 개발자가 실행시킴(exec/await) | 가능           | reconnect 지원         | 초기화 안 된 경우만 큐 | 진짜 lazy                  |
| **redis(ioredis)** | **즉시 실행(시도)**           | 가능           | 자동 reconnect + retry | 자동 internal buffer   | lazy 아님 → auto-buffering |

## 2. pg의 초기화 전략

- pg 특징
  - **모든 쿼리는 DB connection이 반드시 필요**
  - `pool.query()` 호출 = 바로 네트워크 요청
  - 모든 작업이 DB connection에 100% 의존

→ 모든 쿼리를 큐에 넣고, 초기화 끝나면 실행

- 무조건 모든 쿼리를 큐로 보낸다.
  - 초기화 전에 실행하면 **항상 실패**
  - 연결 실패가 자주 발생할 수 있어 **안전성을 보장**해야 함
  - pg는 **lazy model이 아니라 eager model**

```jsx
if (!initialized) {
  queue.push(() => pool.query(sql));
} else {
  return pool.query(sql);
}
```

**→ pg에서는 초기화 여부와 관계없이 무조건 큐잉이 필요하다.**

## 3. mongoose의 초기화 전략

- mongoose 특징
  - ODM 모델 → 스키마 정의, 미들웨어 등록, 모델 생성 등 연결 없이도 가능한 작업이 매우 많다
  - `.find()`, `.save()`는 즉시 실행이 아니라 “query 객체 생성”
    → 실제 실행은 `.exec()` 또는 `await` 시점에 이루어진다.
- lazy execution 모델

```jsx
const q = User.find({ name: "A" }); // 아직 실행 X
await q.exec(); // 이때 연결 필요
```

→ 연결이 안 돼도 실행 시점 이전이므로 문제가 없음.

- 헷갈릴 수 있는 부분 - exec 이 없어도 실행되는 경우가 있음 (but, lazy execution 모델 맞음)

```jsx
await User.find({ name: "A" }).exec();

await User.find({ name: "A" });

User.find({ name: "A" }).then(...);
```

→ mongoose는 쿼리를 Promise처럼 사용 가능하도록 만들었기 때문에 await 또는 then을 쓰면 exec()가 자동으로 호출된다.

- 초기화되지 않았을 때만 큐로 보낸다.
  - 연결 이전에도 수행 가능한 작업이 많다
  - 실제 네트워크 요청은 **나중에 실행되기 때문에** 초기화 미완료여도 괜찮다
  - mongoose는 자동 reconnect 기능을 내장해 탄력적인 연결 모델을 갖는다

```jsx
if (!connected) {
  queue.push(() => executeQuery());
} else {
  return executeQuery();
}
```

**→ mongoose에서는 굳이 모든 요청을 큐에 넣을 필요가 없다.**

## 4. redis 초기화 전략

- redis 특징
  - 명령을 호출하는 순간 바로 실행을 시도한다.
    → 하지만 연결이 아직 준비되지 않았으면 내부 버퍼에 저장해둔다.
  - 즉, 실행 자체는 eager지만 전달은 lazy하게 이루어질 수 있다.
  - 연결 실패·네트워크 지연·재연결 상황을 기본적으로 가정하고 설계됨
  - 자동 reconnect + retry/backoff 기능을 내장하고 있어
    개발자가 오류 처리를 직접 하지 않아도 된다.

→ 연결 전이라도 명령을 편하게 호출할 수 있게 내부에서 자동 큐잉이 수행됨.

---

- 연결되기 전에도 명령 호출이 가능하다:

```jsx
redis.set("a", "1");
// 아직 연결되기 전이어도 OK
// → ioredis 내부 명령 버퍼에 저장됨
// → 연결 완료 시 자동 실행됨
```

## 5. 결론

- 연결이 필요한 시점이 다르다
  - pg: query() 순간 즉시 네트워크 요청
  - mongoose: exec() 순간에 네트워크 요청
  - redis: 명령을 호출하면 실행을 시도하지만, 연결이 안 되어 있으면 내부 버퍼에 저장했다가 연결되면 전송
- lazy vs eager
  - pg는 eager execution
  - mongoose는 lazy execution
  - redis는 eager 실행 시도 + lazy 전송(auto buffering)
- 연결 없이 가능한 작업의 유무
  - pg: 연결 없이는 아무 것도 못함
  - mongoose: 연결 전에도 가능한 작업 많음
  - redis: 연결 없어도 명령 호출 자체는 가능 (내부에서 버퍼링되어 보존됨)
- 큐잉 전략의 차이
  - pg: 연결 전 쿼리는 항상 실패 → 개발자가 직접 모든 요청을 큐잉해야 안전
  - mongoose: 실행 시점이 늦춰지므로 초기화 전에도 안전 → _초기화 안 된 경우에만_ 큐잉
  - redis: 네트워크 불안정성을 가정 → 모든 명령을 내부적으로 자동 큐잉 & 재전송
