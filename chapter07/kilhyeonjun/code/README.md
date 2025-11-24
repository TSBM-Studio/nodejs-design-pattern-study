# Chapter 7 실습 코드

이 디렉토리는 Node.js 디자인 패턴 바이블 7장 "생성자 디자인 패턴"의 주요 예제 코드와 연습 문제 풀이를 포함하고 있습니다.

## 파일 목록

### 1. 팩토리 (Factory) 패턴
- **[profiler.js](profiler.js)**
    - `createProfiler(label)` 팩토리 함수를 통해 프로파일러 인스턴스를 생성합니다.
    - `NODE_ENV` 환경 변수가 `production`일 경우, 아무 동작도 하지 않는 모의(Mock) 객체를 반환하여 성능 오버헤드를 제거합니다.
    - 개발 모드에서는 실제 시간을 측정하는 `Profiler` 객체를 반환합니다.

### 2. 빌더 (Builder) 패턴
- **[url.js](url.js)**
    - 복잡한 생성자를 가진 `Url` 클래스입니다.
    - 프로토콜, 호스트명 등 다양한 URL 구성 요소를 인자로 받습니다.
- **[urlBuilder.js](urlBuilder.js)**
    - `Url` 객체 생성을 돕는 빌더 클래스입니다.
    - `setProtocol`, `setHostname` 등 체이닝 가능한 메소드를 제공하여 가독성을 높입니다.
    - `build()` 메소드를 통해 최종 `Url` 인스턴스를 생성하고 반환합니다.

### 3. 공개 생성자 (Revealing Constructor) 패턴
- **[immutableBuffer.js](immutableBuffer.js)**
    - 생성 시점에만 데이터를 쓸 수 있는 변경 불가능한 버퍼 클래스입니다.
    - 생성자에서 `executor` 함수를 인자로 받아, 이 함수 내부에서만 접근 가능한 수정자(modifier) 함수들을 제공합니다.
    - 객체 생성 후에는 버퍼의 내용을 변경할 수 없습니다.

## 연습 문제 (Exercises)

### 7.1 콘솔 색상 팩토리
- **[consoleColorFactory.js](consoleColorFactory.js)**
    - `createColorConsole(color)` 팩토리 함수를 통해 색상별 콘솔 객체(`RedConsole`, `BlueConsole`, `GreenConsole`)를 생성합니다.
    - 각 콘솔 객체는 `log()` 메소드를 통해 해당 색상으로 문자열을 출력합니다.

### 7.2 Request 빌더
- **[requestBuilder.js](requestBuilder.js)**
    - `http.request()`를 래핑한 빌더 클래스입니다.
    - `setMethod`, `setUrl`, `setHeader`, `setBody` 메소드를 통해 HTTP 요청을 구성합니다.
    - `invoke()` 메소드를 호출하면 `Promise`를 반환하며 요청을 실행합니다.

### 7.3 변경 방지 큐 (Tamper-free Queue)
- **[tamperFreeQueue.js](tamperFreeQueue.js)**
    - 공개 생성자 패턴을 적용한 큐 클래스입니다.
    - 생성 시 제공되는 `executor` 함수를 통해서만 `enqueue` 작업이 가능합니다.
    - 외부에서는 `dequeue()` 메소드만 접근 가능하며, 큐가 비어있을 경우 데이터가 들어올 때까지 대기하는 `Promise`를 반환합니다.

## 실행 방법

각 파일은 모듈로 작성되어 있습니다. 테스트를 위해서는 별도의 실행 파일이 필요하거나, Node.js REPL에서 import하여 사용할 수 있습니다.

```bash
# 예시: REPL에서 실행
node
> const { createProfiler } = await import('./profiler.js');
> const profiler = createProfiler('test');
> profiler.start();
> profiler.end();
```
