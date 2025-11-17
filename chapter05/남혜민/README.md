# Chapter 05. Promise, async/await 비동기 제어 흐름 패턴

## 1. 왜 Promise / async-await 패턴이 중요한가?

- Node.js는 **이벤트 루프 + 비동기 I/O** 기반
- 복잡한 비동기 로직(여러 HTTP 요청, 파일 읽기/쓰기, 재시도, 동시성 제한 등)이 생기면 **제어 흐름**을 설계하는 게 핵심
- 5장에서는 콜백 스타일 대신 **Promise**와 **async/await**로 이를 구조화하는 패턴 소개

---

## 2. Promise & async/await

### 2.1 Promise 체이닝

- 비동기 함수를 **값처럼** 다루기 위한 객체
- `.then()` 체이닝으로 순차 실행
- `.catch()`로 에러 한 번에 처리
- 체이닝을 통해 “비동기 → 동기 코드처럼 왼쪽에서 오른쪽으로 읽히게” 만드는 것
- 하지만 then/catch가 길어지면 여전히 가독성이 떨어짐 → **async/await**로 개선

```js
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("data"), 100);
  });
}

function processData(data) {
  return data.toUpperCase();
}

function saveResult(result) {
  console.log("Saving:", result);
}

fetchData()
  .then((data) => processData(data))
  .then((result) => saveResult(result))
  .catch((err) => {
    console.error("Error in chain:", err);
  });
```

---

### 2.2 async/await

- `async` 함수 안에서만 `await` 사용 가능
- `await`는 Promise가 resolve/reject 될 때까지 기다렸다가 결과/에러를 던져줌
- 에러는 그냥 `try/catch`로 처리
- “비동기 코드를 동기처럼 보이게”

```js
async function main() {
  try {
    const data = await fetchData();
    const result = processData(data);
    await saveResult(result);
  } catch (err) {
    console.error("Error in async function:", err);
  }
}
```

---

## 3. asyncawait-web-spider 패턴: 기본 구조

### 3.1 기본 아이디어

1. `download(url)`: URL에서 HTML을 비동기 다운로드
2. `spider(url)`:
   - 이미 방문한 URL이면 스킵
   - 아니면 다운로드 → 링크 추출 → 각 링크에 대해 재귀적으로 `spider()` 호출
3. 동시성 제한 버전:
   - 현재 진행 중인 작업 개수를 세어가며,
   - 최대 concurrency를 넘지 않도록 스케줄링

---

## 4. 버전 1: 가장 단순한 async/await spider (동시성 제한 없음)

- [version-1](./asyncawait-web-spider-v1.js)

**문제점**

- `for` 루프에서 `await spider(link)`를 순차적으로 호출 → 링크 개수만큼 직렬 실행
- 동시에 여러 페이지를 긁어오지 못해 느림
- 동시 실행을 늘리면 너무 많이 늘어나서 위험
  → 적절한 concurrency limit(동시성 제한) 패턴 필요

---

## 5. 버전 2: Promise.all로 동시 실행 (하지만 제한 없음)

```js
async function spider(url) {
  if (visitedUrls.has(url)) {
    return;
  }
  visitedUrls.add(url);

  const filename = urlToFilename(url);

  let body;
  try {
    body = await download(url, filename);
  } catch (err) {
    console.error(`Error downloading ${url}:`, err);
    return;
  }

  const links = getPageLinks(url, body);

  // concurrent crawling without limit
  const promises = links.map((link) => spider(link));
  await Promise.all(promises);
}
```

**장점**

- `Promise.all` 덕분에 각 링크에 대한 `spider(link)`가 동시에 실행
- 네트워크 I/O를 병렬로 사용 → 속도 개선

**단점**

- 링크가 수백/수천 개이면 동시에 수백/수천 개 요청 발생
- 다운 대상 사이트뿐 아니라, 우리 시스템에도 부담
- 실제 서비스/크롤러에서는 “최대 동시 실행 수” 관리가 사실상 필수

---

## 6. 버전 3: 동시성 제한(concurrency limit) + async/await 조합

### 6.1 설계 아이디어

- 전역적으로 `currentConcurrency`(현재 실행 중 작업 수) 카운트
- `maxConcurrency`(최대 동시 실행 수) 설정
- 새로운 작업을 시작하기 전에:
  - `currentConcurrency < maxConcurrency` 이면 바로 실행
  - 아니면 “대기” (Promise를 이용해 큐에 넣었다가, 슬롯이 나면 깨워서 실행)
- 작업이 끝나면 `currentConcurrency--` 하고 대기 중인 작업 중 하나를 깨움

### 6.2 간단 TaskQueue(concurrency limiter) 구현 예시

```js
// simple concurrency limiter utility

class TaskQueue {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.running = 0;
    this.queue = [];
  }

  async run(taskFn) {
    // taskFn: () => Promise<any>

    if (this.running >= this.maxConcurrency) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.running++;

    try {
      return await taskFn();
    } finally {
      this.running--;

      if (this.queue.length > 0) {
        const resolve = this.queue.shift();
        resolve(); // wake up next waiting task
      }
    }
  }
}
```

### 6.3 동시성 제한을 적용한 async-await spider

```js
// version 3: concurrency-limited async/await web spider

import fs from "fs/promises";
import path from "path";
import { URL } from "url";
import fetch from "node-fetch";

class TaskQueue {
  constructor(maxConcurrency) {
    this.maxConcurrency = maxConcurrency;
    this.running = 0;
    this.queue = [];
  }

  async run(taskFn) {
    if (this.running >= this.maxConcurrency) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.running++;

    try {
      return await taskFn();
    } finally {
      this.running--;
      if (this.queue.length > 0) {
        const resolve = this.queue.shift();
        resolve();
      }
    }
  }
}

const visitedUrls = new Set();
const taskQueue = new TaskQueue(5); // e.g. max 5 concurrent tasks

function urlToFilename(url) {
  const { hostname, pathname } = new URL(url);
  let filename = path.join(hostname, pathname);
  if (filename.endsWith("/")) {
    filename += "index.html";
  }
  return path.join("downloads", filename);
}

async function download(url, filename) {
  console.log(`Downloading ${url}`);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status} for ${url}`);
  }

  const body = await response.text();
  await fs.mkdir(path.dirname(filename), { recursive: true });
  await fs.writeFile(filename, body);
  console.log(`Downloaded and saved: ${filename}`);

  return body;
}

function getPageLinks(url, body) {
  // TODO: parse HTML and extract links
  return [];
}

async function spider(url) {
  if (visitedUrls.has(url)) {
    return;
  }
  visitedUrls.add(url);

  const filename = urlToFilename(url);

  let body;
  try {
    // IMPORTANT: wrap download in TaskQueue to limit concurrency
    body = await taskQueue.run(() => download(url, filename));
  } catch (err) {
    console.error(`Error downloading ${url}:`, err);
    return;
  }

  const links = getPageLinks(url, body);

  // child spiders still use recursion, but downloads are limited by TaskQueue
  await Promise.all(links.map((link) => spider(link)));
}

async function main() {
  const url = process.argv[2] ?? "https://example.com/";
  try {
    await spider(url);
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

main();
```

---

## 7. 에러 처리 패턴

### 7.1 로컬 try/catch vs 상위 레벨 처리

- 개별 작업에서 복구 가능한 에러:
  - 다운로드 실패, 특정 URL 404 등 → `spider` 안에서 로그만 찍고 계속 진행
- 전체 시스템을 멈추게 해야 하는 에러:
  - 설정 파일 읽기 실패, DB 커넥션 실패 등 → `main()`에서 잡아서 `process.exit(1)` 등

```js
async function spider(url) {
  try {
    const filename = urlToFilename(url);
    const body = await taskQueue.run(() => download(url, filename));
    const links = getPageLinks(url, body);
    await Promise.all(links.map((link) => spider(link)));
  } catch (err) {
    console.error(`Non-fatal error on ${url}:`, err);
    // do not throw: continue crawling other links
  }
}

async function main() {
  try {
    await spider("https://example.com/");
  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  }
}
```

---

## 8. 유틸리티 패턴: Promise.all / allSettled / race

- `Promise.all(promises)`

  - 모든 Promise가 성공해야 resolve
  - 하나라도 reject 하면 즉시 reject
  - → 동시 실행 + 하나라도 실패하면 전체 실패

- `Promise.allSettled(promises)`
  - 모든 Promise가 완료(성공/실패)될 때까지 기다리고, 각각의 상태 반환
  - → 크롤링처럼 “실패해도 계속 진행”이 필요한 상황에서 유용

```js
const results = await Promise.allSettled(links.map((link) => spider(link)));
const failed = results.filter((r) => r.status === "rejected");
console.log(`Failed links: ${failed.length}`);
```

추가로, `Promise.race`를 이용해 타임아웃 래퍼를 만드는 패턴도 자주 쓰인다.

```js
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Operation timed out")), ms)
    ),
  ]);
}
```

---

## 9. 고민 거리

1. 동시성 제한 수(concurrency)는 어떻게 정할까?
   - CPU 코어 수? 네트워크 대역폭? 대상 서버의 허용 범위?
2. `Promise.all` vs `Promise.allSettled` vs 직접 `for await ... of` 루프
   - 어떤 상황에서 어떤 패턴이 더 적절한가?
3. 에러가 많을 때:
   - “전체 실패”로 보고 중단 vs “실패는 로그만 찍고 계속 진행” 중 어느 쪽이 나은가?
