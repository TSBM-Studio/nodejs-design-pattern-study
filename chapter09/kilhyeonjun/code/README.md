# Chapter 9: 행위 디자인 패턴 - 실습 코드

이 디렉토리에는 Chapter 9에서 다루는 행위 디자인 패턴(전략, 상태, 템플릿, 반복자, 미들웨어, 명령)의 실습 코드가 포함되어 있습니다.

## 실행 방법

```bash
# 개별 파일 실행
node 01-strategy-config.js

# ESM 모듈이므로 Node.js 14+ 권장
node --experimental-modules 파일명.js  # Node.js 12-13의 경우
```

## 본문 예제 코드

### 01-strategy-config.js
**전략 패턴 - 다중 형식 환경설정**

JSON, INI, YAML 등 다양한 형식을 지원하는 Config 클래스입니다.

```bash
node 01-strategy-config.js
```

**핵심 포인트:**
- 컨텍스트(Config)와 전략(jsonStrategy, iniStrategy 등) 분리
- 런타임에 전략 교체 가능
- 새로운 형식 추가 시 기존 코드 수정 불필요

---

### 02-state-failover-socket.js
**상태 패턴 - 장애 조치 소켓**

연결 상태(Online/Offline)에 따라 다르게 동작하는 소켓입니다.

```bash
node 02-state-failover-socket.js
```

**핵심 포인트:**
- 오프라인: 메시지 큐잉
- 온라인: 메시지 즉시 전송 + 큐 플러시
- 상태 전환 시 이벤트 발생

---

### 03-template-config-manager.js
**템플릿 패턴 - 환경설정 관리자**

알고리즘 구조를 상위 클래스에서 정의하고, 세부 구현은 하위 클래스에서 담당합니다.

```bash
node 03-template-config-manager.js
```

**핵심 포인트:**
- ConfigTemplate: read/save 알고리즘 구조 정의
- JsonConfig, IniConfig, YamlConfig: _serialize/_deserialize 구현
- 상속 기반 확장

---

### 04-iterator-basics.js
**반복자 프로토콜 기본**

JavaScript의 Iterator/Iterable 프로토콜을 이해합니다.

```bash
node 04-iterator-basics.js
```

**핵심 포인트:**
- `next()` 메서드: `{ value, done }` 반환
- `Symbol.iterator`: 이터러블 프로토콜
- for...of, 스프레드 연산자, Array.from 지원

---

### 05-generator-examples.js
**제너레이터 예제**

`function*`과 `yield`를 사용한 제너레이터 구현입니다.

```bash
node 05-generator-examples.js
```

**핵심 포인트:**
- 간결한 이터러블 구현
- 양방향 통신 (next()에 값 전달)
- yield* 위임
- 트리 순회 예제

---

### 06-async-iterator.js
**비동기 반복자**

`Symbol.asyncIterator`와 `for await...of`를 사용한 비동기 순회입니다.

```bash
node 06-async-iterator.js
```

**핵심 포인트:**
- async function* 제너레이터
- 페이지네이션 시뮬레이션
- 순차 vs 병렬 처리 비교

---

### 07-middleware-express-style.js
**Express 스타일 미들웨어**

콜백 기반의 Express 스타일 미들웨어 패턴입니다.

```bash
node 07-middleware-express-style.js
```

**핵심 포인트:**
- `use()`: 미들웨어 등록
- `next()`: 다음 미들웨어 호출
- 에러 처리: `next(err)`

---

### 08-middleware-koa-style.js
**Koa 스타일 미들웨어**

async/await 기반의 Koa 스타일 미들웨어 패턴입니다.

```bash
node 08-middleware-koa-style.js
```

**핵심 포인트:**
- "양파 껍질" 구조
- `await next()` 전후로 요청/응답 처리
- try/catch로 에러 처리

---

### 09-command-pattern.js
**명령 패턴**

실행 정보를 객체로 캡슐화하여 다양한 기능을 지원합니다.

```bash
node 09-command-pattern.js
```

**핵심 포인트:**
- run(): 명령 실행
- undo(): 실행 취소
- serialize(): 직렬화 (저장/전송)
- delay(): 지연 실행

---

## 연습문제 풀이

`exercises/` 디렉토리에 책 연습문제(p391-392) 풀이가 있습니다.

### exercises/9.1-strategy-logger.js
**전략 패턴으로 로깅 구현**

런타임에 로깅 대상(콘솔/파일/JSON)을 교체할 수 있는 Logger입니다.

```bash
node exercises/9.1-strategy-logger.js
```

**구현된 전략:**
- ConsoleStrategy: 콘솔 출력
- FileStrategy: 텍스트 파일 저장
- JsonFileStrategy: JSON 형식 파일 저장
- MultiStrategy: 다중 출력

---

### exercises/9.2-template-logger.js
**템플릿 패턴으로 로깅 구현**

상속을 통해 출력 대상을 변경하는 Logger입니다.

```bash
node exercises/9.2-template-logger.js
```

**구현된 클래스:**
- Logger (템플릿): 포맷팅 담당
- ConsoleLogger: 콘솔 출력
- FileLogger: 파일 출력
- ColorConsoleLogger: 컬러 콘솔 출력
- JsonFileLogger: JSON 형식 출력

---

### exercises/9.3-warehouse-state.js
**상태 패턴으로 창고 아이템 관리**

WarehouseItem의 상태(Arriving → Stored → Delivered)를 관리합니다.

```bash
node exercises/9.3-warehouse-state.js
```

**상태 전환:**
- Arriving: 도착 예정 → store() → Stored
- Stored: 입고됨 → deliver() → Delivered
- Delivered: 배송 완료 (더 이상 전환 불가)

---

### exercises/9.4-middleware-logger.js
**미들웨어 패턴으로 로깅 구현**

파이프라인을 통해 로그를 처리하는 시스템입니다.

```bash
node exercises/9.4-middleware-logger.js
```

**미들웨어:**
- timestampMiddleware(): 타임스탬프 추가
- filterMiddleware(): 레벨 필터링
- serializeMiddleware(): 직렬화 (text/json)
- saveToFileMiddleware(): 파일 저장
- consoleMiddleware(): 콘솔 출력

---

### exercises/9.5-async-queue-iterator.js
**비동기 대기열 반복자**

`for await...of`로 순회 가능한 비동기 큐입니다.

```bash
node exercises/9.5-async-queue-iterator.js
```

**기능:**
- enqueue(): 아이템 추가
- dequeue(): 아이템 제거 (대기 가능)
- close(): 큐 종료
- Symbol.asyncIterator: 비동기 순회

---

## 패턴 요약

| 파일 | 패턴 | 핵심 개념 |
|------|------|----------|
| 01 | 전략 | 컨텍스트 + 교체 가능한 전략 객체 |
| 02 | 상태 | 상태별 동작 캡슐화 + 상태 전환 |
| 03 | 템플릿 | 상위 클래스 알고리즘 + 하위 클래스 구현 |
| 04 | 반복자 | Iterator/Iterable 프로토콜 |
| 05 | 제너레이터 | function*, yield, yield* |
| 06 | 비동기 반복자 | async function*, for await...of |
| 07 | 미들웨어 | Express 스타일, next() 콜백 |
| 08 | 미들웨어 | Koa 스타일, await next() |
| 09 | 명령 | 실행 객체화, undo/serialize |

## 의존성

모든 예제는 Node.js 내장 모듈만 사용하며 별도 설치가 필요 없습니다.

```bash
# Node.js 14 이상 권장 (ESM 지원)
node --version
```

## 전략 vs 상태 vs 템플릿 비교

```
┌──────────┬─────────────────┬─────────────────┬─────────────────┐
│  패턴    │     전략        │      상태       │     템플릿      │
├──────────┼─────────────────┼─────────────────┼─────────────────┤
│ 목적     │ 알고리즘 교체   │ 상태별 동작     │ 알고리즘 구조   │
│ 확장     │ 컴포지션        │ 컴포지션        │ 상속            │
│ 전환     │ 클라이언트가    │ 상태 객체가     │ 해당 없음       │
│          │ 결정            │ 결정            │                 │
│ 런타임   │ 가능            │ 가능            │ 불가능          │
│ 교체     │                 │                 │                 │
└──────────┴─────────────────┴─────────────────┴─────────────────┘
```
