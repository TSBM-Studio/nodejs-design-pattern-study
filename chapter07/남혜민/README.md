# Chapter 07. 생성자 디자인 패턴

## 팩토리 (Factory)

-   **목적**: 객체 생성 로직을 한 곳에 모아두고, 사용하는 쪽은 생성 방식을 몰라도 되게 함.
-   **특징**
    -   `new`를 직접 쓰지 않고, 팩토리 함수/모듈이 대신 생성.
    -   설정, 환경 변수, 인자 등에 따라 서로 다른 구현체를 반환.
    -   동일 인터페이스(메서드 집합)를 가지는 여러 구현 중 하나를 선택해서 반환.

```javascript
// 단순 팩토리 예시
function createLogger(type) {
    if (type === 'file') return new FileLogger();
    if (type === 'console') return new ConsoleLogger();
    throw new Error('Unknown logger type');
}

const logger = createLogger(process.env.LOGGER_TYPE);
logger.log('hello');
```

---

## 빌더 (Builder)

-   **목적**: 복잡한 객체 생성을 단계적으로 분리해서, 가독성을 높이고 생성 과정을 유연하게 제어.
-   **특징**
    -   옵션이 많거나 인자가 복잡한 객체를 만들 때 유용.
    -   메서드 체이닝으로 설정 → 마지막에 `build()`로 완성.
    -   기본값/필수값 검증을 한 곳에 모을 수 있음.
    -   인터페이스에 따라 명확하게 값을 설정하는 setter 함수로 캡슐화.

```javascript
class HttpRequestBuilder {
    constructor() {
        this.req = { headers: {} };
    }

    setMethod(method) {
        this.req.method = method;
        return this;
    }

    setUrl(url) {
        this.req.url = url;
        return this;
    }

    addHeader(key, value) {
        this.req.headers[key] = value;
        return this;
    }

    build() {
        return this.req;
    }
}

const req = new HttpRequestBuilder()
    .setMethod('GET')
    .setUrl('/users')
    .addHeader('Accept', 'application/json')
    .build();
```

---

## 공개 생성자 (Public Constructor)

-   **목적**: 가장 기본적인 객체 생성 방식. `new` 키워드로 직접 인스턴스를 생성.
-   **특징**
    -   단순하고 직관적.
    -   생성 방법이 코드 전반에 흩어지면, 초기화/검증 로직이 중복될 수 있음.
    -   생성 방식을 나중에 바꾸기 어렵고, 팩토리/빌더/싱글톤과 비교되는 기준점 역할.

```javascript
class User {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

const user = new User(1, 'Alice');
```

---

## 싱글톤 (Singleton)

-   **목적**: 애플리케이션 전체에서 인스턴스를 단 하나만 유지해서 공유.
-   **특징**
    -   Node.js에서는 모듈 캐시 때문에, 한 번 생성한 인스턴스를 `module.exports`로 내보내면 사실상 싱글톤.
    -   설정, 로거, DB 커넥션 풀 등 “전역적인 하나”가 자연스러운 대상.
    -   상태가 전역으로 공유되므로, 테스트 간 간섭이나 결합도 증가에 주의.

```javascript
// logger.js
class Logger {
    info(msg) {
        console.log(msg);
    }
}

module.exports = new Logger(); // 싱글톤 인스턴스

// other-file.js
const logger = require('./logger');
logger.info('Hello');
```

---

## 모듈 와이어링(Wiring, Composition Root)

-   **목적**: 모듈/객체들을 “어떻게 연결할지(의존성 주입)”를 한 곳에서 책임지는 조립 단계.
-   **특징**
    -   객체/모듈 생성과 의존성 주입(DI)을 한 파일(Composition Root)에서 관리.
    -   비즈니스 로직은 “무엇을 필요로 하는지”만 알도록 하고, “어떤 구현체를 쓸지”는 와이어링 단계에서 결정.
    -   테스트 시 가짜 구현(mock, stub)으로 쉽게 교체 가능.

```javascript
// dbFactory.js
function createDb(type) {
    if (type === 'memory') return new InMemoryDb();
    if (type === 'mongo') return new MongoDb();
    throw new Error('Unknown db type');
}

module.exports = createDb;

// wiring.js (composition root)
const createDb = require('./dbFactory');
const UserService = require('./UserService');
const UserController = require('./UserController');

const db = createDb(process.env.DB_TYPE || 'memory');
const userService = new UserService(db);
const userController = new UserController(userService);

module.exports = { userController };
```

---

## 고민 거리

-   팩토리와 빌더를 언제 구분해서 써야 할까?
    -   팩토리는 무엇을 만들지 선택하는 데 초점,
        빌더는 어떻게 조립할지 단계적으로 표현하는 데 초점.
-   싱글톤을 어디까지 허용할지, 테스트와 결합도에 어떤 영향을 주는지.
-   모듈 와이어링을 어디 파일에서 할지
    -   예: `app.js`, `server.js` 등 “애플리케이션 진입점”에 모두 모을 것인지,
    -   기능별로 여러 개의 composition root를 둘 것인지.
