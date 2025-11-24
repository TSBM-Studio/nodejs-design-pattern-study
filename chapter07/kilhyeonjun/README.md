# Chapter 7: 생성자 디자인 패턴

> **발표자**: 길현준
> **발표일**: 2025-11-24
> **주제**: 객체 생성과 관련된 Node.js 디자인 패턴

---

## 📌 목차

1. [개요](#개요)
2. [팩토리 (Factory)](#1-팩토리-factory)
3. [빌더 (Builder)](#2-빌더-builder)
4. [공개 생성자 (Revealing Constructor)](#3-공개-생성자-revealing-constructor)
5. [싱글톤 (Singleton)](#4-싱글톤-singleton)
6. [모듈 와이어링 (Module Wiring)](#5-모듈-와이어링-module-wiring)
7. [요약](#요약)

---

## 개요

이 장에서는 **생성(Creational)** 디자인 패턴을 다룹니다. 이름에서 알 수 있듯이, 이 패턴들은 **객체의 생성**과 관련된 문제들을 해결합니다.

JavaScript와 Node.js의 특성상 전통적인 GoF(Gang of Four) 패턴과는 구현 방식이나 중요도가 다를 수 있습니다.

- **팩토리(Factory)**: 객체 생성과 구현을 분리
- **빌더(Builder)**: 복잡한 객체 생성을 단순화
- **공개 생성자(Revealing Constructor)**: 생성 시에만 내부 기능 노출 (Node.js/JS 특화)
- **싱글톤(Singleton)**: 단일 인스턴스 보장
- **모듈 와이어링(Wiring)**: 시스템 모듈 간의 연결 관리

---

## 1. 팩토리 (Factory)

Node.js에서 가장 일반적인 디자인 패턴입니다. `new` 연산자나 `Object.create()` 대신 함수를 호출하여 객체를 생성합니다.

### 1-1. 객체 생성과 구현의 분리

**장점**:
- **유연성**: 객체 생성 로직을 캡슐화하여 클라이언트가 구체적인 클래스나 생성 방식을 알 필요가 없습니다.
- **확장성**: 조건에 따라 다른 객체를 반환하거나, 캐싱된 인스턴스를 반환할 수 있습니다.
- **캡슐화**: 클로저를 활용해 `private` 변수를 구현할 수 있습니다.

**예시: 이미지 파일 확장자에 따른 객체 생성**

```javascript
function createImage(name) {
  if (name.match(/\.jpe?g$/)) {
    return new ImageJpeg(name);
  } else if (name.match(/\.gif$/)) {
    return new ImageGif(name);
  } else if (name.match(/\.png$/)) {
    return new ImagePng(name);
  } else {
    throw new Error('Unsupported format');
  }
}
```

### 1-2. 캡슐화 강제 (Private 변수)

클로저를 사용하여 외부에서 접근 불가능한 `private` 멤버를 만들 수 있습니다.

```javascript
function createPerson(name) {
  const privateProperties = {}; // 외부 접근 불가

  const person = {
    setName(name) {
      if (!name) throw new Error('A person must have a name');
      privateProperties.name = name;
    },
    getName() {
      return privateProperties.name;
    }
  };

  person.setName(name);
  return person;
}
```

### 1-3. 실전 예제: 코드 프로파일러

환경 변수(`NODE_ENV`)에 따라 동작이 다른 객체를 반환하는 팩토리입니다.

- **Production**: 아무 동작도 하지 않는 `noopProfiler` 반환 (성능 영향 최소화)
- **Development**: 실제 동작하는 `Profiler` 반환

```javascript
// profiler.js
class Profiler {
  constructor(label) {
    this.label = label;
    this.lastTime = null;
  }
  start() { this.lastTime = process.hrtime(); }
  end() {
    const diff = process.hrtime(this.lastTime);
    console.log(`Timer "${this.label}" took ${diff[0]}s ${diff[1]}ns.`);
  }
}

const noopProfiler = { start() {}, end() {} };

export function createProfiler(label) {
  if (process.env.NODE_ENV === 'production') {
    return noopProfiler;
  }
  return new Profiler(label);
}
```

---

## 2. 빌더 (Builder)

복잡한 객체의 생성을 단계별로 나누어 단순화하고 가독성을 높이는 패턴입니다.

### 2-1. 왜 필요한가?

생성자 인자가 너무 많으면 코드를 읽기 어렵고 실수하기 쉽습니다.

**Before (복잡한 생성자)**:
```javascript
const myBoat = new Boat(true, 2, 'Best Motor Co.', 'OM123', true, 1, 'fabric', 'white', 'blue', false);
// 인자의 순서와 의미를 알기 어려움
```

**After (빌더 패턴 적용)**:
```javascript
const myBoat = new BoatBuilder()
  .withMotors(2, 'Best Motor Co.', 'OM123')
  .withSails(1, 'fabric', 'white')
  .withCabin()
  .hullColor('blue')
  .build();
// 가독성이 좋고 의미가 명확함
```

### 2-2. 구현 규칙

1.  **가독성**: 복잡한 생성자를 읽기 쉬운 단계로 분리
2.  **유창한 인터페이스(Fluent Interface)**: `return this`를 통해 체이닝 지원
3.  **명확성**: Setter 함수 이름으로 의도 전달
4.  **검증**: `build()` 단계에서 최종 객체의 유효성 검사 및 일관성 보장

### 2-3. 실전 예제: URL 객체 빌더

URL의 다양한 구성 요소를 설정하는 빌더입니다.

```javascript
// urlBuilder.js
export class UrlBuilder {
  setProtocol(protocol) {
    this.protocol = protocol;
    return this;
  }
  setAuthentication(username, password) {
    this.username = username;
    this.password = password;
    return this;
  }
  setHostname(hostname) {
    this.hostname = hostname;
    return this;
  }
  // ... 기타 setter ...
  
  build() {
    return new Url(this.protocol, this.username, /* ... */);
  }
}
```

---

## 3. 공개 생성자 (Revealing Constructor)

객체가 **생성되는 순간에만** 내부 기능을 노출하는 패턴입니다. `Promise`가 대표적인 예입니다.

### 3-1. 구조

```javascript
const object = new SomeClass(function executor(revealedMembers) {
  // 생성 시점에만 revealedMembers를 통해 내부 조작 가능
});
```

### 3-2. 활용 사례: 변경 불가능한(Immutable) 버퍼

생성 시에만 데이터를 쓸 수 있고, 생성 후에는 읽기 전용인 버퍼를 만듭니다.

```javascript
// immutableBuffer.js
export class ImmutableBuffer {
  constructor(size, executor) {
    const buffer = Buffer.alloc(size);
    const modifiers = {}; // 버퍼를 수정하는 함수들 (write, fill 등)
    
    // 버퍼의 메소드를 순회하며 수정자(modifier)와 읽기 전용 메소드 분리
    // ... (구현 생략) ...

    executor(modifiers); // 실행 함수에만 수정자 전달
  }
}
```

**사용 예시**:
```javascript
const hello = 'Hello!';
const immutable = new ImmutableBuffer(hello.length, ({ write }) => {
  write(hello); // 생성 시점에만 write 가능
});

console.log(String.fromCharCode(immutable.readInt8(0))); // 읽기 가능
// immutable.write('Hello?'); // 에러! write 함수는 인스턴스에 없음
```

### 3-3. 대표적인 예: Promise

```javascript
new Promise((resolve, reject) => {
  // resolve와 reject는 이 executor 함수 내부에서만 사용 가능
  // 외부에서는 Promise의 상태를 변경할 수 없음
});
```

---

## 4. 싱글톤 (Singleton)

클래스의 인스턴스가 **오직 하나만 존재**하도록 보장하는 패턴입니다.

### 4-1. Node.js에서의 싱글톤

Node.js의 모듈 시스템은 기본적으로 모듈을 캐싱하므로, **객체 인스턴스를 `export` 하는 것만으로도 싱글톤과 유사한 효과**를 낼 수 있습니다.

```javascript
// dbInstance.js
export const dbInstance = new Database('my-app-db');
```

```javascript
// 다른 파일들
import { dbInstance } from './dbInstance.js';
// 항상 동일한 인스턴스를 공유함
```

### 4-2. 주의사항 (함정)

모듈 캐싱은 **파일의 절대 경로**를 키(Key)로 사용합니다.
만약 패키지 의존성 구조(`node_modules`)가 복잡하여 동일한 패키지가 여러 경로에 설치된다면, **서로 다른 인스턴스**가 생성될 수 있습니다.

```
app/
├── node_modules/
    ├── package-a/
    │   └── node_modules/
    │       └── mydb/ (버전 1.0.0)
    └── package-b/
        └── node_modules/
            └── mydb/ (버전 2.0.0)
```
위 경우 `package-a`와 `package-b`는 서로 다른 `mydb` 인스턴스를 사용하게 됩니다.

---

## 5. 모듈 와이어링 (Module Wiring)

애플리케이션의 모듈 간 **의존성(Dependency)**을 관리하는 방법입니다.

### 5-1. 싱글톤 의존성 (Hard Coupling)

모듈이 다른 모듈(싱글톤)을 직접 `import` 하여 사용하는 방식입니다.

- **장점**: 구현이 간단하고 편리함.
- **단점**: 모듈 간 결합도가 높음. 테스트 시 Mock 객체로 대체하기 어려움.

```javascript
// blog.js
import { db } from './db.js'; // 직접 import (강한 결합)

export class Blog {
  // ... db를 직접 사용
}
```

### 5-2. 종속성 주입 (Dependency Injection, DI)

의존성을 모듈 내부에서 직접 생성하거나 가져오지 않고, **외부에서 주입**받는 방식입니다.

- **장점**: 결합도가 낮아짐. 테스트 용이성 향상 (Mock 주입 가능). 모듈 재사용성 증가.
- **단점**: 의존성 조립을 위한 초기화 코드가 복잡해질 수 있음.

```javascript
// blog.js
export class Blog {
  constructor(db) {
    this.db = db; // 외부에서 주입받음
  }
  // ...
}
```

**DI를 활용한 모듈 연결 (Wiring)**:

```javascript
// index.js (Main)
import { createDb } from './db.js';
import { Blog } from './blog.js';

async function main() {
  const db = createDb('data.sqlite'); // 1. 의존성 생성
  const blog = new Blog(db);          // 2. 의존성 주입
  await blog.initialize();
}
```

---

## 요약

| 패턴 | 핵심 설명 | Node.js 활용 예 |
|------|-----------|----------------|
| **Factory** | 객체 생성 로직 캡슐화 | `createProfiler()`, 다양한 설정에 따른 인스턴스 반환 |
| **Builder** | 복잡한 객체 생성 단계 단순화 | `superagent`, `knex` 쿼리 빌더 |
| **Revealing Constructor** | 생성 시에만 내부 조작 권한 부여 | `Promise`, `ImmutableBuffer` |
| **Singleton** | 단일 인스턴스 공유 | 모듈 시스템(`export const instance = ...`) |
| **DI** | 의존성 주입을 통한 결합도 감소 | 테스트 용이성, 모듈 재사용성 증대 |

---
