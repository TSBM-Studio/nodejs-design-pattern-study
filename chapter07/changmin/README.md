# Node.js Design Patterns

## Chapter 7 - GoF 디자인 패턴 (생성 패턴)

객체의 생성과 관련된 문제를 해결하는 디자인 패턴을 다루는 챕터

### 핵심 내용

디자인 패턴 -> 반복된 문제에 대한 재사용 가능한 해결책

GoF 디자인 패턴은 보편적인 해결책이지만, JavaScript에 그대로 적용하는 것은 적절하지 않음

JavaScript의 특성 (프로토타입 기반, 동적 타이핑, 함수가 일급 객체)으로 인해 같은 문제를 해결하는 방법이 여러 가지

패턴의 "형식"이 아닌 "핵심 아이디어"가 중요

- Factory: 객체 생성 로직을 캡슐화하여 클라이언트와 구현체 분리
- Revealing Constructor: 생성 단계에서만 내부 수정 허용 → 강력한 캡슐화
- Builder: 복잡한 객체 생성을 단계별로 구성
- Singleton: 애플리케이션 전역에서 단 하나의 인스턴스 공유
- Dependency Injection: 구성요소 간 결합도를 낮춰 확장성 강화

---

## 1. Factory Pattern

### 1.1 Factory Pattern이란?

함수 내에서 객체의 생성 로직을 캡슐화하여 클라이언트와 구현체 분리

### 1.2 주요 목적

**특정 구현으로부터 객체의 생성을 분리할 수 있음 -> 유연성 증가 (실행 시 생성되는 객체를 결정)**

```javascript
function createLogger(type) {
  switch (type) {
    case "console":
      return new ConsoleLogger();
    case "file":
      return new FileLogger("./log.txt");
    default:
      throw new Error(`Invalid logger type: ${type}`);
  }
}

// use case 1
const logger = createLogger("console");

// use case 2
const logger = createLogger("file");
```

**생성자 노출 X, 구현 변경 시 영향 최소화 -> 캡슐화 강화 (함수의 스코프와 클로저를 활용)**

```javascript
function creatPerson(name) {
  const privateProperties = {};

  const person = {
    setName(name) {
      if (!name) throw new Error("Name is required");
      privateProperties.name = name;
    },
    getName() {
      return privateProperties.name;
    },
  };

  person.setName(name);
  return person;
}

const person = createPerson("John");
person.getName(); // John
```

- private 클래스 필드 사용 (node.js 12 이상)

```javascript
class Person {
  #name;

  constructor(name) {
    this.#name = name;
  }
}
```

-> 내부에서 weakMap 을 사용하여 구현 (GC)

주의 : TS 에서 `private` 키워드는 타입 체크에만 사용되고, 실제 캡슐화는 제공하지 않음

## 2. Builder Pattern

### 2.1 Builder Pattern이란?

유창한 인터페이스 (체이닝)를 제공하여 복잡한 객체의 생성을 단순화

### 2.2 주요 목적

**인자의 목록이 길거나, 많은 복잡한 매개변수를 입력으로 사용하는 생성자가 있는 클래스 -> 완전하고 일관된 상태의 인스턴스를 만들 때**

답답한 상황

```javascript
class User {
  constructor(name, age, email, phone, address, isAdmin, isActive, isVerified) {
    this.name = name;
    this.age = age;
    this.email = email;
    this.phone = phone;
    this.address = address;
    this.isAdmin = isAdmin;
    this.isActive = isActive;
    this.isVerified = isVerified;
  }
}

const user = new User(
  "John Doe",
  30,
  "john.doe@example.com",
  "1234567890",
  "123 Main St, Anytown, USA",
  true,
  true,
  true
); // 복잡하고 뭐가 뭔지 모름
```

1차 개선안 - 모든 인자를 하나의 객체 리터럴에 모아서 처리

```javascript
class User {
  constructor(userAttributes) {
    //..
  }
}

const user = new User({
  name: "John Doe",
  age: 30,
  email: "john.doe@example.com",
  phone: "1234567890",
  address: "123 Main St, Anytown, USA",
  isAdmin: true,
  isActive: true,
  isVerified: true,
}); // 훨씬 더 명확하고 읽기 쉬움
```

2차 개선안 - Builder Pattern 적용

```javascript
class User {
  setName(name) {
    this.name = name;
    return this;
  }
  setAge(age) {
    this.age = age;
    return this;
  }
  setEmail(email) {
    this.email = email;
    return this;
  }
  setPhone(phone) {
    this.phone = phone;
    return this;
  }
  setAddress(address) {
    this.address = address;
    return this;
  }
  setIsAdmin(isAdmin) {
    this.isAdmin = isAdmin;
    return this;
  }
  setIsActive(isActive) {
    this.isActive = isActive;
    return this;
  }
  setIsVerified(isVerified) {
    this.isVerified = isVerified;
    return this;
  }
  build() {
    return new User(
      this.name,
      this.age,
      this.email,
      this.phone,
      this.address,
      this.isAdmin,
      this.isActive,
      this.isVerified
    );
  }
}

const user = new User()
  .setName("John Doe")
  .setAge(30)
  .setEmail("john.doe@example.com")
  .setPhone("1234567890")
  .setAddress("123 Main St, Anytown, USA")
  .setIsAdmin(true)
  .setIsActive(true)
  .setIsVerified(true)
  .build();
```

-> 각 setter 함수는 우리가 설정하는 매개 변수에 대한 힌트를 명확히 제공

## 3. Revealing Constructor Pattern

### 3.1 Revealing Constructor Pattern이란?

객체가 생성되는 그 짧은 순간에만, 내부를 조작할 수 있는 권한을 준다.

이 패턴은 GoF의 전통적인 디자인 패턴이 아니며, Node.js와 JavaScript 커뮤니티에서 독자적으로 발전한 패턴

```javascript
// (1) 생성자
const object = new SomeClass(
  // (2) 실행자 (Executor)
  function executor(revealedMembers) {
    // (3) 공개 멤버 변수 (여기서만 접근 가능!)
    revealedMembers.privateMethod();
  }
);
```

### 3.2 주요 목적

**생성 시에만 수정 가능한 객체 생성 -> 일단 만들어지면 불변(Immutable)이 됨**

**사용자 정의 초기화 -> 생성자가 복잡한 로직 대신, 사용자가 직접 초기화 로직을 주입하도록 함**

```javascript
const promise = new Promise((resolve, reject) => {
  // 생성자 내부(Executor)에서는 상태를 변경할 수 있음
  if (true) resolve("Success"); // 상태 변경 (Pending -> Fulfilled)
});

// 객체 생성 후에는 상태를 변경할 방법이 아예 없음 (캡슐화)
// promise.resolve("New Value"); // 불가능
promise.then((data) => console.log(data)); // 결과 조회는 가능함
```

## 4. Singleton Pattern

### 4.1 Singleton Pattern이란?

GoF의 전통적인 싱글톤 패턴은 앱 전체에서 단 하나의 인스턴스 공유 -> DB 커넥션 풀과 같은 리소스 객체에 대표적으로 사용

### 4.2 주요 목적

Node.js "모듈 캐싱" 메커니즘 -> `new` 키워드로 인스턴스 생성 후 `export` 하면 그 자체로 싱글톤

```javascript
// database.ts
class DB { ... }

// 여기서 new를 해서 결과물만 내보냄
export const dbInstance = new DB();

// index.ts
import { dbInstance as a } from "./database";
import { dbInstance as b } from "./database";


console.log(a === b); // true
```

주의 사항 - 싱글톤이 깨지는 순간

NodeJS 모듈 캐싱 -> "파일 경로"를 키로 동작

#### ❌ node_modules 중복 설치 문제

만약 `mypackage`라는 라이브러리가 싱글톤(`dbInstance`)을 제공하는데, 이 패키지가 여러 버전으로 설치되어 있다면?

```js
// app.js
import { dbInstance } from "./db.js";
// 여기서 dbInstance는 앱 전체에서 공유되는 유일한 객체입니다. 실패!)
```

#### 해결책

1.  **버전 정리:** `npm dedupe` 또는 `yarn` 등을 통해 패키지 버전을 일치시켜서 최상위(root) `node_modules`로 호이스팅(Hoisting) 시킴
2.  **Global 변수 사용 (최후의 수단):** `global.dbInstance = new Database()` 처럼 전역 변수에 박아버릴 수도 있지만, 좋은 방법은 아님

## 5. Module Wiring

### 5.1 Module Wiring이란?

모든 애플리케이션은 여러 모듈(컴포넌트)을 서로 연결한 결과물 -> 이러한 의존성 그래프 (관계)

### 5.2 싱글톤 의존성

가장 간단한 연결 방식은 모듈 캐싱을 이용한 싱글톤 공유

```js
// db.js
import sqlite3 from "sqlite3";
export const db = new sqlite3.Database("./data.sqlite");

// blog.js
import { db } from "./db.js";
```

**장점**

- 구현이 매우 쉬움
- Node.js 모듈 캐시 덕분에 모든 곳에서 동일 인스턴스를 공유함

**단점**

- blog.js가 특정 DB 구현에 강하게 묶임(결합도 ↑)
- 테스트 시 가짜 DB로 교체하기 어렵고, 패키지 중복 설치 시 싱글톤이 깨질 수 있음

### 5.3 의존성 주입 (DI)

싱글톤 방식의 결합도를 낮추기 위한 전통적 해법은 의존성 주입

```js
// blog.js
export class Blog {
  constructor(db) {
    this.db = db; // 필요로 하는 의존성을 외부에서 주입받음
  }
}

// main.js (와이어링 전담)
import { Blog } from "./blog.js";
import { createDb } from "./db.js";

const db = createDb("./data.sqlite"); // 어떤 DB든 생성 가능
const blog = new Blog(db); // 원하는 의존성을 주입
```

**장점**

- Blog가 특정 DB 구현을 몰라도 됨(결합도 ↓).
- 테스트 시 메모리 DB, Mock 객체 등을 쉽게 주입할 수 있음
- 런타임 설정에 따라 다른 구현체를 선택할 수 있어 확장성이 커짐

**단점**

- 초기 설계/와이어링 코드가 길어짐
- 의존성 그래프를 관리할 별도의 “인젝터” 또는 구성 루틴이 필요함

## 결론

이 장에서는 JavaScript/Node.js에서 생성 패턴을 어떻게 현실적으로 재해석하는 가에 대한 내용을 말함

핵심은 “형식을 그대로 옮기기”가 아니라, 각 패턴의 의도를 이해한 뒤 자바스크립트 고유의 특성(동적 타이핑, 모듈 캐시, 함수형 스타일 등)과 조합하는 것

결국 “패턴 자체가 목적”이 아니라 “패턴을 통해 해결하려는 문제”가 중요함
