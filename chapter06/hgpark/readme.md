# Chapter 6. Coding with Streams

# 1. 스트림이 중요한 이유: Buffering vs Streaming

대량 데이터를 처리할 때 두 가지 접근 방법이 존재한다.

## 1.1 Buffering 방식의 문제

* 전체 파일을 한 번에 메모리에 로드
* 압축/Gzip/암호화 같은 연산은 전체 버퍼가 준비된 뒤 시작
* 수백 MB~GB 파일 처리 시 메모리 누수/과도한 GC 유발 가능

## 1.2 Streaming 방식의 장점

스트림은 데이터를 **chunk 단위로 처리**한다.

데이터의 첫 chunk가 도착하는 즉시 처리 파이프라인이 시작되며,
이후 chunk들도 순서대로 비동기로 처리된다.

### 시간 효율성

* 파이프라인 전체 시간이 chunk 처리 병렬성으로 단축됨
* Readable → Transform → Writable 흐름이 비동기적으로 연결되어 처리 지연 없음

### 공간 효율성

* chunk 단위 → 메모리 사용량 거의 일정
* 전체 파일이 메모리에 로드되지 않아 O(1) 수준의 메모리 사용

# 2. 이벤트 루프와 스트림 내부 동작

## 2.1 스트림과 이벤트 루프의 관계

Node.js 스트림은 단순히 “chunk를 읽고 쓰는 것”이 아니라, 내부적으로 **Libuv 비동기 I/O + Node.js의 스트림 상태 머신**이 결합된 구조로 동작한다.

### Readable Stream 내부 사이클

Readable Stream은 다음과 같은 상태 머신을 가진다:

1. **ReadableState 생성**

   * `highWaterMark`, `buffer`, `length`, `reading`, `ended`, `flowing` 등의 내부 필드가 초기화됨
   * `buffer`는 단순 배열이 아니라 **링 버퍼에 가까운 형태로, chunk들이 push되는 구조**
2. **_read() 호출 트리거**

   * consumer가 `.read()` 호출하거나 flowing 모드로 전환되면
   * 내부에서 아래가 실행됨:

     ```
     if (!state.reading) {
       state.reading = true
       stream._read(state.highWaterMark) // 사용자 구현
     }
     ```
3. **OS 비동기 I/O 요청(Libuv)**

   * 구현체가 `fs.read()`를 호출할 경우 libuv의 thread pool에서 비동기로 처리
   * 완료 후 poll 단계에서 이벤트 발생
4. **chunk push**

   * poll 단계에서 I/O 완료 → Node가 콜백 실행 → `stream.push(chunk)` 호출
   * push 시에는 다음이 수행됨:

     * 내부 buffer에 chunk 추가
     * `length` 증가
     * ‘data’ 이벤트 emit (flowing 모드일 경우)
     * backpressure 및 flowing 상태에 따라 `_read()` 호출 여부 다시 판단

### Writable Stream 내부 사이클

Writable Stream은 다음 상태 머신으로 동작한다:

1. **Write 요청**

   * `.write(chunk)` 호출 시 내부적으로 `WritableState`의 버퍼에 저장
   * 버퍼 크기가 `highWaterMark`를 넘으면 write()는 `false` 반환 → backpressure 전파
2. **_write() dispatch**

   * flowing 상태라면 즉시 `_write(chunk, enc, cb)` 호출
   * 아닌 경우 nextTick 또는 microtask에서 dispatch
3. **OS 비동기 write 요청(Libuv)**

   * 파일/소켓에 대해서는 libuv write queue를 통해 비동기 처리
   * 완료되면 poll 단계에서 콜백 실행
   * cb() 호출 → 다음 chunk 처리

### Transform Stream 구조

Transform Stream은 내부적으로 다음과 같이 구성된 **Duplex 래퍼**이다:

```
Readable side buffer → _transform() → Writable side buffer
```

* push()는 Readable 버퍼로 이동
* callback()은 Writable 측 backpressure 해제를 의미

Transform Stream이 병렬/순차 처리를 쉽게 제어 가능한 이유는
**_transform()이 완료되지 않으면 절대 다음 chunk를 처리하지 않도록 상태 머신이 설계되어 있기 때문**이다.

# 3. Stream 객체 구조 및 동작 방식

# 3.1 Readable Streams

### 핵심 메서드

* `_read(size)`
* 구현자는 특정 시점에 데이터를 `push()`해야 한다.

예제: 랜덤 문자열 생성 스트림

### 흐름

1. consumer가 `read()` 호출 또는 flowing 모드 전환
2. 내부적으로 `_read()` 호출
3. `_read()`에서 chunk를 push
4. push(null) → end 이벤트 발생

### 비동기 I/O

Readable이 fs.read()를 사용할 경우:

```
_read() 호출 → fs.read() 비동기 요청 → 이벤트 루프 poll에서 완료 처리 → chunk push
```

즉, **Readable은 내부 버퍼를 채우기 위해 이벤트 루프를 반복적으로 활용**한다.

# 3.2 Writable Streams

### 핵심 메서드

* `_write(chunk, encoding, callback)`
* callback을 호출해야 다음 chunk가 처리된다.

### Backpressure(역압)

Writable 스트림은 내부적으로 `WritableState`라는 구조체를 가지고 있으며, 이 안에는:

* `highWaterMark` (기본 16KB)
* `length` (현재 버퍼링된 데이터 양)
* `needDrain` (역압 발생 여부)
* `writing` (현재 write 처리 여부)
* `buffer` (대기 중인 chunk 리스트)

등의 속성이 있다.

### write()가 false를 반환하는 정확한 기준

```
if (state.length > state.highWaterMark) {
  return false  // → 역압 신호 발생
}
```

즉, write() 호출 시 데이터가 버퍼에 쌓이기 때문에 write()는 단순히 “OS에 즉시 쓰기”가 아니라 **버퍼에 넣고 비동기 처리하는 메커니즘**이다.

### drain 이벤트는 어떻게 발생하는가?

1. producer가 write()를 연속 호출
2. state.length > highWaterMark → write() false
3. 이후 `_write()`가 처리되어 버퍼가 줄어들면
4. write queue가 비워지는 순간 Node.js가 다음을 수행:

   ```
   state.needDrain = false;
   stream.emit('drain');
   ```
5. producer는 ‘drain’ 이벤트를 받고 write 재개

### pipe()에서 backpressure는 upstream으로 어떻게 전파되는가?

pipe() 내부 구현(간략화):

```
source.on('data', (chunk) => {
  const canWrite = dest.write(chunk)
  if (!canWrite) {
    source.pause()
    dest.once('drain', () => source.resume())
  }
})
```

즉:

* downstream이 느리면 dest.write() false return
* pipe()는 source.pause() 호출
* drain 이벤트 발생 시 source.resume()

이 동작이 이벤트 루프 기반으로 연결되어 자동 속도 조절(backpressure)이 이루어진다.

# 3.3 Transform Streams

입력 → 변환 → 출력

* `_transform(chunk, encoding, callback)` 구현
* callback 호출 시 다음 chunk로 넘어감

Transform Stream의 중요한 특성:

* 비동기 처리가 자연스럽다
* callback을 언제 호출하느냐에 따라 chunk 처리 순서/속도를 제어할 수 있음

문서 예: CSV 필터링/합산 스트림 구현

Transform은 내부적으로 **Readable + Writable**로 구성된 Duplex Stream이다.

# 3.4 PassThrough Streams

Transform의 특별한 형태

* 데이터를 그대로 전달
* 디버깅, lazy connection, late piping에 사용됨

**왜 중요한가?**
비동기 파이프라인에서 데이터 흐름을 중단시키지 않으면서 특정 흐름을 관찰하거나, 나중에 pipeline을 구성할 수 있는 유연성을 제공한다.

# 4. Backpressure 상세 이해

Backpressure는 producer와 consumer의 속도가 맞지 않을 때 발생한다.

### Writable 관점:

* 내부 버퍼(writableBuffer)가 특정 크기 이상이면 write() → false
* producer는 더 이상의 write()를 보류
* consumer는 drain 이벤트 발생 시점에 버퍼 재개

### Transform 관점:

* transform이 callback을 늦게 호출하면 upstream이 backpressure 느끼고 소스 읽기 속도를 자동 감소

즉, **스트림은 속도 조절을 이벤트 루프 기반으로 자동화**한다.

# 5. 스트림 연결 (Pipes)와 pipeline() 사용

# 5.1 pipe()의 한계

pipe()는 단순 연쇄 연결이지만:

* 에러가 자동으로 전파되지 않음
* 하나의 스트림에서 에러가 나면 전체 파이프라인이 안전하게 복구되지 않음

이를 해결하기 위해 이전에는 모든 스트림에 error 핸들러를 등록해야 했다.

# 5.2 pipeline()

pipeline()은 pipe()의 상위 래퍼이며, 내부적으로 다음 단계로 스트림을 연결한다:

1. **전달된 스트림 배열을 순차적으로 pipe() 호출**

   * stream[0].pipe(stream[1])
   * stream[1].pipe(stream[2])
   * …
2. **각 스트림에 error, close, finish를 자동 바인딩**
   주요 헬퍼: `destroyer(stream, reading, writing)`

   * error 발생 시:

     * 모든 스트림을 `stream.destroy(err)` 호출
     * pending I/O, buffer, file descriptor 모두 해제
3. **콜백 호출 타이밍 관리**

   * 마지막 스트림의 ‘finish’ 또는 ‘end’에서 pipeline callback 실행
   * error 발생 시:

     * 한번만 callback(err) 호출되도록 플래그 관리
4. **Promise 자동화 (Node v15+)**

   * callback을 생략하면 Promise 반환
   * pipeline() 종료 시 resolve, 에러 발생 시 reject
   * microtask queue에서 처리되어 이벤트 루프에 영향 최소화

### pipe()와의 가장 큰 차이


| 기능        | pipe()              | pipeline()                    |
| ------------- | --------------------- | ------------------------------- |
| 에러 전파   | 수동                | 자동 전파                     |
| 리소스 정리 | 직접 destroy() 필요 | 전체 스트림 destroy 자동 적용 |
| 스트림 연결 | 직렬 연결만         | 연결 + 안전한 종료            |
| Promise     | 미지원              | Promise 기반 가능             |

즉, pipeline()은 파이프라인을 “하나의 트랜잭션”처럼 관리한다.

# 6. 고급 스트림 패턴

# 6.1 Late Piping

스트림을 먼저 생성해두고 나중에 대상 스트림을 pipe로 연결
→ PassThrough가 자주 사용됨

Ex) createUploadStream 구현

* 스트림을 미리 생성해둬도 실제 데이터 전달은 나중에 일어남
* pipeline이 나중에 구성되지만 chunk는 정상 보관됨

# 6.2 Lazy Streams

스트림 생성 시 I/O 리소스를 즉시 열지 않기 위함
파일 디스크립터 고갈(EMFILE) 방지
→ lazystream 라이브러리 활용

내부 동작:

* 소비자가 read()를 호출하는 시점에서 Readable 생성
* 그 전까지 실제 I/O 시작되지 않음

비동기 I/O 자원 관리를 효율화하는 훌륭한 패턴

# 6.3 Combined Streams

여러 스트림을 하나의 black-box 스트림으로 묶음
예: pumpify 사용

장점:

* 내부 파이프라인 감춤
* 에러 핸들링 일원화
* 재사용성 향상

예제: gzip + encrypt → decrypt + ungzip 조합 스트림 구현

# 6.4 Parallel Stream Patterns (비동기 흐름 제어)

## 6.4.1 Sequential Execution

Transform 스트림의 _transform은 callback 호출 전까지 다음 chunk 전송 금지
→ 자연스럽게 순차 실행 흐름 구현 가능

## 6.4.2 Unordered Parallel Execution

각 chunk를 비동기 처리하고 결과를 push
문서의 URL 체크 예제에서 사용됨

## 6.4.3 Limited Parallel Execution

동시 처리 개수를 제한
→ 이벤트 루프 과부하 방지
→ 네트워크/DB 요청을 적절히 throttling

문서의 LimitedParallelStream 예시

## 6.4.4 Ordered Parallel Execution

병렬로 처리하되 결과 순서를 입력 순서대로 유지
parallel-transform 라이브러리로 구현 가능

# 6.5 Forking, Merging, Multiplexing

### Forking

하나의 스트림 데이터를 여러 흐름으로 분기
→ real-time 로그 처리, 분석 등에서 활용

### Merging

여러 입력 스트림을 하나로 합침
→ 큰 텍스트 파일 병합 예제 문서 제공

### Multiplex / Demultiplex

여러 채널을 하나의 스트림으로 합치거나 분리
→ 원격 로깅, 네트워크 프로토콜 구현에서 활용됨

# 7. 실무에서 Streams를 왜 사용해야 하는가?

1. **대량 데이터 처리 시 성능과 메모리 안정성을 제공**
2. **비동기 제어 흐름을 자연스럽게 표현 가능**
3. **I/O-bound 시스템에서 이벤트 루프의 효율을 극대화**
4. **병렬 처리 및 순서 보장 패턴을 모두 지원**
5. **error-safe 파이프라인 구성 가능(pipeline())**
6. **직접 구현 가능한 커스텀 스트림(Readable/Writable/Transform)**
7. **기능 조합(combinator pattern)이 쉬워서 유지보수 용이**
