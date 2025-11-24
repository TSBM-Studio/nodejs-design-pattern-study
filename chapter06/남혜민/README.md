# Chapter 06. 스트림 코딩

> [!NOTE] 학습 목표
>
> - Node.js 스트림이 중요한 이유
> - 스트림 이해와 사용 및 생성
> - 프로그래밍 패러다임으로서의 스트림: I/O 뿐만 아니라, 다양한 상황에서 강력한 기능의 활용
> - 여러 환경에서의 스트리밍 패턴 및 스트림 연결

## 목차

- [Chapter 06. 스트림 코딩](#chapter-06-스트림-코딩)
  - [목차](#목차)
  - [6-1. 스트림의 중요성](#6-1-스트림의-중요성)
    - [1. 버퍼링 대 스트리밍](#1-버퍼링-대-스트리밍)
    - [2. 공간 효율성](#2-공간-효율성)
    - [3. 시간 효율성](#3-시간-효율성)
  - [6-2. 스트림 시작하기](#6-2-스트림-시작하기)
    - [1. 스트림 해부 : Readable, Writable, Duplex, Transform](#1-스트림-해부--readable-writable-duplex-transform)
      - [Readable 스트림](#readable-스트림)
      - [Writable 스트림](#writable-스트림)
      - [Duplex 스트림](#duplex-스트림)
      - [Transform 스트림](#transform-스트림)
    - [PassThrough 스트림](#passthrough-스트림)
      - [지연(Lazy) 스트림](#지연lazy-스트림)
    - [Pipe 및 `pipeline()`, 오류 처리](#pipe-및-pipeline-오류-처리)
  - [6-3. 파이핑(Piping) 패턴](#6-3-파이핑piping-패턴)
    - [1. 스트림 결합 (Composition)](#1-스트림-결합-composition)
    - [2. 스트림 분기 (Branching)](#2-스트림-분기-branching)
    - [3. 스트림 병합 (Merging)](#3-스트림-병합-merging)
    - [4. 멀티플렉싱 및 디멀티플렉싱](#4-멀티플렉싱-및-디멀티플렉싱)
  - [6-5. 요약](#6-5-요약)

## 6-1. 스트림의 중요성

### 1. 버퍼링 대 스트리밍

![buffer-vs-streaming.png](buffer-vs-streaming.png)

**개념**

- 버퍼링 방식
  - 전체 데이터를 메모리에 다 읽은 뒤 한 번에 처리.
  - 예: `fs.readFile('bigfile', (err, data) => { ... })`
- 스트리밍 방식

  - 데이터를 작은 청크(chunk) 단위로 도착하는 대로 처리.
  - 예: `fs.createReadStream('bigfile').on('data', ...)`

- 버퍼링은 코드가 단순하지만, 데이터가 커질수록 위험/비효율.
- 스트리밍은 코드가 다소 복잡하지만, 데이터 크기와 무관한 처리가 가능.

### 2. 공간 효율성

**개념**

- 버퍼링:
  - 입력 전체를 메모리에 올려 두고 처리 ⇒ 입력 크기와 메모리 사용량이 비례.
- 스트리밍:

  - 한 번에 메모리에 쌓이는 데이터는 최대 청크 크기 + 내부 버퍼(highWaterMark) 정도.
  - 입력 크기가 10GB든 100GB든, 메모리 사용량은 상대적으로 일정.

- 데이터 크기와 무관하게 동작하는 코드를 만들 수 있다는 점이 설계 관점에서 중요.
- 배포 환경 메모리가 512MB뿐인 서비스에서도 대용량 처리가 가능.

### 3. 시간 효율성

**개념**

- 버퍼링 방식:

  - 데이터 전체가 다 읽힐 때까지 결과가 나오지 않는다.
  - latency(첫 결과가 나오기까지 걸리는 시간)가 전체 처리 시간과 거의 동일.

- 스트리밍 방식:

  - 일부 청크가 도착하자마자, 그 청크에 대한 결과부터 바로 내보낼 수 있음.
  - throughput(전체 처리량)뿐만 아니라 latency를 줄이는 데 유리.

- 스트리밍은 처리 시작과 결과 관찰 사이의 시간을 줄여준다.
- 실시간 로그/이벤트 처리, 동영상/오디오 스트리밍, API 응답 스트리밍에 특히 중요.

## 6-2. 스트림 시작하기

### 1. 스트림 해부 : Readable, Writable, Duplex, Transform

#### Readable 스트림

**핵심 개념**

- 데이터 소스(source) 역할.
- 두 가지 모드:
  - non-flowing 모드: 필요할 때 `readable.read()`로 땡겨 쓰는 방식.
  - flowing 모드: `'data'` 이벤트로 자동으로 흘러나오는 방식.
- 구현 시 오버라이드 메서드: `_read(size)`

- flowing/non-flowing 모드 전환:
  - `readable.on('data', ...)`를 붙이면 flowing 모드로 전환.
  - `readable.pause()` / `readable.resume()`으로 제어 가능.
- 직접 구현할 때 핵심은 언제 `push()`할지, 언제 `null`을 push할지.

#### Writable 스트림

**핵심 개념**

- 데이터 목적지(sink) 역할.
- 구현 시 오버라이드 메서드: `_write(chunk, encoding, callback)`
  - `chunk`를 처리한 후 반드시 `callback()` 호출해야 다음 청크가 들어온다.

**배압(Backpressure)**

- `writable.write(chunk)`의 반환값:

  - `true` ⇒ 아직 내부 버퍼 여유 있음, 계속 써도 됨.
  - `false` ⇒ 내부 버퍼 꽉 참, 잠시 쓰기를 멈추고 `'drain'` 이벤트를 기다려야 함.

- backpressure를 제대로 처리하지 않으면:
  - 메모리 폭증(버퍼가 계속 커짐),
  - 이벤트 루프/GC 부담 증가.
- 스트림을 직접 구현할수록, 이 부분을 명시적으로 신경 써야 한다.

#### Duplex 스트림

**핵심 개념**

- Readable + Writable을 동시에 가지는 스트림.
- 예:

  - TCP 소켓 (`net.Socket`) – 읽기도 쓰기도 가능.
  - 프로토콜 구현 시 유용 (양방향 전송).

- 양방향 통신이나 중간에서 읽고 쓰는 네트워크 프록시 같은 형태로 등장.
- 보통은 Transform을 더 많이 쓰고, Duplex는 낮은 레벨 통신에 많이 활용.

---

#### Transform 스트림

**핵심 개념**

- Duplex 스트림의 특별한 경우:
  - 입력과 출력이 1:1 관계 (또는 0~N : 0~M 관계)인 변환 로직을 담는 스트림.
- 구현 시 오버라이드 메서드: `_transform(chunk, encoding, callback)`

  - 여기서 `this.push()`를 호출해 변환된 데이터를 내보냄.
  - 필요하면 `_flush(callback)`으로 스트림 종료 직전 마지막 처리 가능.

- 대문자 변환, 라인 스플리터, JSON 파서, CSV 파서 등 모든 데이터 변환 로직이 Transform으로 표현됨.
- `readable.pipe(transformA).pipe(transformB).pipe(writable)` 패턴의 중심.

---

### PassThrough 스트림

**핵심 개념**

- Transform의 한 종류인데, 아무 변환도 하지 않고 입력을 그대로 출력으로 흘려보냄.
- 사용처:
  - 디버깅용: 중간에 끼워서 데이터 로깅.
  - 관창(pipe inspection) 포인트로 활용.
  - 느린 파이프 연결 시 중간 버퍼처럼 사용할 수 있음.

---

#### 지연(Lazy) 스트림

**핵심 개념**

- 필요할 때까지 실제 작업을 시작하지 않는 스트림 패턴.
- 예:
  - 실제로 `pipe()` 되거나 `'data'` 핸들러가 붙는 순간 데이터 생산을 시작.
- 장점:
  - 사용되지 않을 수도 있는 스트림에 대해 불필요한 I/O를 미리 시작하지 않음.

---

### Pipe 및 `pipeline()`, 오류 처리

기본 `pipe()`

- `readable.pipe(transform).pipe(writable)`
- 장점: 간결, 직관적.
- 단점:
  - 에러 처리를 각 스트림마다 `'error'` 핸들러로 해야 함.
  - 파이프라인 전체를 하나의 작업 단위로 관리하기 어렵다.

`stream.pipeline()`

- 사용 예:

  ```js
  const { pipeline } = require("stream");
  const { promisify } = require("util");
  const pipelineAsync = promisify(pipeline);

  await pipelineAsync(
    createReadStream("input.txt"),
    new SomeTransform(),
    createWriteStream("output.txt")
  );
  ```

- 특징:
  - 중간 어느 스트림에서 에러가 나도 전체 파이프라인을 정리(destroy).
  - 콜백 또는 Promise/async 형태로 제어 흐름을 통합할 수 있음.

## 6-3. 파이핑(Piping) 패턴

### 1. 스트림 결합 (Composition)

**개념**

- 여러 Transform 스트림을 체인으로 연결해 하나의 큰 파이프라인을 구성.
  - 예: `파일 → 라인 분리 → 필터 → 포맷팅 → 출력`
- 장점:

  - 각 단계는 작고 재사용 가능한 모듈.
  - 조합을 바꾸는 것만으로 다른 파이프라인을 쉽게 구성.

---

### 2. 스트림 분기 (Branching)

**개념**

- 하나의 입력 스트림을 여러 경로로 분기해서 처리.
  - 예: 로그 스트림 → (1) 파일에 저장, (2) 콘솔 출력, (3) 특정 조건만 알림 스트림으로.
- 구현 방식:
  - 하나의 Readable에서 데이터를 읽어 여러 Writable/Transform으로 write/pipe.
  - 또는 PassThrough + 여러 파이프.

---

### 3. 스트림 병합 (Merging)

**개념**

- 여러 입력 스트림을 하나의 출력 스트림으로 합치기.
  - 예: 여러 로그 파일/소켓에서 오는 이벤트를 하나의 스트림으로 통합.
- 구현 패턴:
  - 커스텀 Readable/Transform에서 여러 소스 스트림을 구독하고, 들어오는 순서대로 push.
  - 또는 병합 시 우선순위/라벨링을 적용.

---

### 4. 멀티플렉싱 및 디멀티플렉싱

**멀티플렉싱(Multiplexing)**

- 여러 논리 스트림을 하나의 물리 스트림 위에 올려 보내는 패턴.
  - 예: 하나의 TCP 연결에서 여러 채널(채팅, 알림, 파일 전송 등)을 구분해 사용.
- 구현 개념:
  - 각 메시지에 채널 ID, 타입, 길이 등을 태깅하고,
  - 수신 측에서 이 메타데이터로 어떤 논리 스트림에 전달할지 분배.

**디멀티플렉싱(Demultiplexing)**

- 멀티플렉싱된 단일 스트림을 다시 여러 개의 논리 스트림으로 분리.

- 멀티플렉싱/디멀티플렉싱은:
  - 네트워크 프로토콜 설계, IPC, 마이크로서비스 간 통신 등에서 중요한 패턴.
  - Node의 스트림 추상화로 비교적 쉽게 구현 가능.

## 6-5. 요약

- 스트림은 단순한 I/O 도구가 아니라, 대용량 데이터 처리 + 비동기 제어 흐름을 동시에 다루는 핵심 추상화.
- 핵심 개념:
  - 버퍼링 vs 스트리밍
  - 공간/시간 효율성
  - 스트림 타입: Readable, Writable, Duplex, Transform, PassThrough
  - backpressure, highWaterMark
  - `pipe()` vs `pipeline()` + 에러 처리
  - 순차/병렬/순서 보장 병렬 처리
  - 결합/분기/병합/멀티플렉싱 패턴
