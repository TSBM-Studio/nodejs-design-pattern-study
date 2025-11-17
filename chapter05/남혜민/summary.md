# Chapter 05. Promise, async/await 비동기 제어 흐름 패턴

## 목차

- [Chapter 05. Promise, async/await 비동기 제어 흐름 패턴](#chapter-05-promise-asyncawait-비동기-제어-흐름-패턴)
  - [목차](#목차)
  - [5-1. Promise 개요](#5-1-promise-개요)
  - [5-2. Promise 사용법](#5-2-promise-사용법)
  - [5-3. Promise 체이닝과 에러 처리](#5-3-promise-체이닝과-에러-처리)
  - [5-4. async/await 개요](#5-4-asyncawait-개요)
  - [5-5. async/await 사용법](#5-5-asyncawait-사용법)
  - [5-6. async/await와 에러 처리](#5-6-asyncawait와-에러-처리)
  - [5-7. 요약](#5-7-요약)

## 5-1. Promise 개요

- 비동기 작업의 완료 또는 실패를 나타내는 객체
- 콜백 지옥(callback hell) 문제 해결
- 상태(state): 대기(pending), 이행(fulfilled), 거부(rejected)
- 값(value) 또는 이유(reason): 이행 시 값, 거부 시 이유
- then(), catch(), finally() 메서드
- 체이닝(chaining) 가능
- ES6 표준
- 비동기 작업의 결과를 더 쉽게 관리하고 조작할 수 있도록 도와줌
- 비동기 작업의 흐름 제어에 유용
- 콜백 함수보다 가독성 향상
- 에러 처리 일원화
- 병렬 비동기 작업 처리 가능
- 다양한 라이브러리와 프레임워크에서 널리 사용
  - 예: Axios, Fetch API 등

## 5-2. Promise 사용법

- Promise 생성: new Promise((resolve, reject) => { ... })
- 이행(resolve)과 거부(reject)
- then() 메서드: 이행 시 콜백 등록
- catch() 메서드: 거부 시 콜백 등록
- finally() 메서드: 완료 시 콜백 등록 (이행/거부 상관없이)
- 예시 코드:

```javascript
const myPromise = new Promise((resolve, reject) => {
  // 비동기 작업 수행
  const success = true; // 작업 성공 여부
  if (success) {
    resolve("작업 성공");
  } else {
    reject("작업 실패");
  }
});
myPromise
  .then((result) => {
    console.log(result); // '작업 성공'
  })
  .catch((error) => {
    console.error(error); // '작업 실패'
  })
  .finally(() => {
    console.log("작업 완료");
  });
```

## 5-3. Promise 체이닝과 에러 처리

- then() 메서드 체이닝: 여러 비동기 작업 순차 처리
- 각 then()은 새로운 Promise 반환
- catch()로 체이닝 전체의 에러 처리 가능
- 예시 코드:

```javascript
const fetchData = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("데이터 로드 완료"), 1000);
  });
};
fetchData()
  .then((data) => {
    console.log(data); // '데이터 로드 완료'
    return "다음 작업으로 이동";
  })
  .then((message) => {
    console.log(message); // '다음 작업으로 이동'
    // 에러 발생 시뮬레이션
    throw new Error("문제가 발생했습니다!");
  })
  .catch((error) => {
    console.error("에러 처리:", error.message); // '에러 처리: 문제가 발생했습니다!'
  });
```

## 5-4. async/await 개요

- 비동기 코드를 동기 코드처럼 작성 가능
- async 함수: 항상 Promise 반환
- await 키워드: Promise가 해결될 때까지 대기
- 가독성 향상 및 에러 처리 간소화
- ES2017 표준
- 예시 코드:

```javascript
async function fetchData() {
  return "데이터 로드 완료";
}
fetchData().then((data) => console.log(data)); // '데이터 로드 완료'
```

## 5-5. async/await 사용법

- async 함수 선언: async function functionName() { ... }
- await 키워드 사용: const result = await promise;
- try/catch로 에러 처리
- 예시 코드:

```javascript
async function fetchData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve("데이터 로드 완료"), 1000);
  });
}
async function main() {
  try {
    const data = await fetchData();
    console.log(data); // '데이터 로드 완료'
  } catch (error) {
    console.error("에러 처리:", error);
  }
}
main();
```

## 5-6. async/await와 에러 처리

- try/catch 블록 사용
- await로 호출한 Promise가 거부되면 catch 블록으로 이동
- 예시 코드:

```javascript
async function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("데이터 로드 실패")), 1000);
  });
}
async function main() {
  try {
    const data = await fetchData();
    console.log(data);
  } catch (error) {
    console.error("에러 처리:", error.message); // '에러 처리: 데이터 로드 실패'
  }
}
main();
```

## 5-7. 요약

- Promise와 async/await는 비동기 프로그래밍을 위한 강력한 도구
- Promise는 비동기 작업의 완료/실패를 나타내는 객체
- async/await는 비동기 코드를 동기 코드처럼 작성 가능하게 함
- 가독성 향상 및 에러 처리 간소화
- 다양한 비동기 작업에 효과적으로 활용 가능
- 현대 자바스크립트 개발에서 필수적인 개념
- 실제 프로젝트에서 적극 활용 권장
- 비동기 작업의 복잡성을 줄이고 코드 유지보수성 향상
- 추가 학습 자료:
- MDN 웹 문서: [Promise](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise), [async/await](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function)
- 자바스크립트 공식 문서: [ECMAScript 2017](https://www.ecma-international.org/ecma-262/8.0/index.html)
- 다양한 온라인 튜토리얼과 강의 참고
