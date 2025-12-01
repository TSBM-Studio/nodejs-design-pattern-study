# Chapter 8: 구조적 설계 패턴 - 실습 코드

이 디렉토리에는 Chapter 8에서 다루는 구조적 설계 패턴(프록시, 데코레이터, 어댑터)의 실습 코드가 포함되어 있습니다.

## 실행 방법

```bash
# 개별 파일 실행
node 01-stack-calculator.js

# ESM 모듈 실행 (package.json에 "type": "module" 필요)
node --experimental-modules 파일명.js
```

## 본문 예제 코드

### 01-stack-calculator.js
**기본 StackCalculator 클래스**

스택 기반 계산기 구현입니다. 모든 프록시/데코레이터 예제에서 Subject로 사용됩니다.

```bash
node 01-stack-calculator.js
```

**예상 출력:**
```
3 * 2 = 6
6 * 2 = 12
10 / 0 = Infinity
```

---

### 02-safe-calculator-composition.js
**객체 컴포지션을 사용한 프록시**

클래스와 팩토리 함수 두 가지 방식으로 컴포지션 프록시를 구현합니다.

```bash
node 02-safe-calculator-composition.js
```

**핵심 포인트:**
- Subject를 변경하지 않고 안전하게 프록시
- 모든 함수를 수동으로 위임해야 하는 단점

---

### 03-safe-calculator-augmentation.js
**객체 확장(몽키 패치)을 사용한 프록시**

Subject를 직접 수정하여 함수를 프록시 구현으로 대체합니다.

```bash
node 03-safe-calculator-augmentation.js
```

**주의사항:**
- Subject가 공유되는 경우 피해야 함
- 원본 동작이 변경되어 부작용 발생 가능

---

### 04-safe-calculator-proxy.js
**ES2015 Proxy 객체를 사용한 프록시**

가장 현대적이고 강력한 프록시 구현 방법입니다.

```bash
node 04-safe-calculator-proxy.js
```

**핵심 포인트:**
- Subject를 변경하지 않음
- 동적 속성 접근 가능
- instanceof 연산자 지원

---

### 05-logging-writable.js
**Writable 스트림 로깅 프록시**

write() 호출을 가로채 로깅하는 실전 예제입니다.

```bash
node 05-logging-writable.js
```

**예상 출력:**
```
=== 로깅 프록시 테스트 ===

Writing: First chunk
Writing: Second chunk

--- 원본 스트림 사용 (로깅 없음) ---

--- 프록시 스트림 사용 (로깅됨) ---
Writing: Third chunk
```

---

### 06-create-observable.js
**변경 옵저버 패턴**

객체 속성 변경을 감지하고 옵저버에게 알리는 반응형 프로그래밍 기초입니다.

```bash
node 06-create-observable.js
```

**예상 출력:**
```
Starting total: 110
TOTAL: 210 (subtotal changed: 100 -> 200)
TOTAL: 200 (discount changed: 10 -> 20)
TOTAL: 210 (tax changed: 20 -> 30)
Final total: 210
```

---

### 07-enhanced-calculator-decorator.js
**데코레이터 패턴**

세 가지 방식(컴포지션, 객체 확장, Proxy)으로 데코레이터를 구현합니다.

```bash
node 07-enhanced-calculator-decorator.js
```

**핵심 포인트:**
- add(), subtract() 등 새로운 기능 추가
- 기존 divide() 동작 수정

---

### 08-level-subscribe.js
**LevelUP 플러그인 데코레이터**

패턴 매칭 구독 기능을 추가하는 LevelUP 플러그인입니다.

```bash
# level 패키지 설치 필요 (선택)
npm install level

node 08-level-subscribe.js
```

**참고:** level 패키지 없이도 시뮬레이션 모드로 실행됩니다.

---

### 09-fs-adapter.js
**fs API 어댑터**

LevelUP을 fs 모듈처럼 사용할 수 있는 어댑터입니다.

```bash
# level 패키지 설치 필요 (선택)
npm install level

node 09-fs-adapter.js
```

**참고:** level 패키지 없이도 시뮬레이션 모드로 실행됩니다.

---

## 연습문제 풀이

`exercises/` 디렉토리에 책 연습문제(p334-335) 풀이가 있습니다.

### exercises/8.1-http-client-cache.js
**HTTP 클라이언트 캐시 프록시**

HTTP 요청 응답을 캐싱하는 프록시입니다.

```bash
node exercises/8.1-http-client-cache.js
```

**기능:**
- TTL(Time To Live) 기반 캐시 만료
- 최대 캐시 크기 제한
- GET 요청만 캐싱

---

### exercises/8.2-timestamp-console-proxy.js
**로그 타임스탬프 프록시**

모든 로그에 타임스탬프를 추가합니다.

```bash
node exercises/8.2-timestamp-console-proxy.js
```

**예상 출력:**
```
2024-12-01T10:30:45.123Z hello
2024-12-01T10:30:45.124Z 정보 메시지
```

---

### exercises/8.3-color-console-decorator.js
**컬러 콘솔 데코레이터**

red(), yellow(), green() 등 컬러 출력 함수를 추가합니다.

```bash
node exercises/8.3-color-console-decorator.js
```

**기능:**
- 기본 색상: red, green, yellow, blue, magenta, cyan
- 시맨틱 함수: success, warning, error, info
- 스타일: bold, dim, underline

---

### exercises/8.4-virtual-filesystem-adapter.js
**가상 파일 시스템 어댑터**

메모리 기반 가상 파일 시스템입니다. fs API와 호환됩니다.

```bash
node exercises/8.4-virtual-filesystem-adapter.js
```

**지원 API:**
- readFile, writeFile
- readdir, mkdir
- stat, existsSync, unlink

---

### exercises/8.5-lazy-buffer.js
**지연 버퍼 프록시**

write() 호출 시에만 Buffer를 할당하는 지연 초기화 프록시입니다.

```bash
node exercises/8.5-lazy-buffer.js
```

**핵심 포인트:**
- 메모리 효율적인 버퍼 관리
- 사용하지 않으면 실제 메모리 할당 없음

---

## 패턴 요약

| 파일 | 패턴 | 구현 기술 |
|------|------|----------|
| 02 | 프록시 | 컴포지션 |
| 03 | 프록시 | 객체 확장 |
| 04 | 프록시 | ES2015 Proxy |
| 05 | 프록시 | ES2015 Proxy |
| 06 | 프록시 | ES2015 Proxy (변경 옵저버) |
| 07 | 데코레이터 | 컴포지션/확장/Proxy |
| 08 | 데코레이터 | 객체 확장 |
| 09 | 어댑터 | 컴포지션 |

## 의존성

대부분의 예제는 Node.js 내장 모듈만 사용하며 별도 설치가 필요 없습니다.

LevelUP 예제(08, 09)를 완전히 실행하려면:

```bash
npm install level
```

없어도 시뮬레이션 모드로 실행됩니다.
