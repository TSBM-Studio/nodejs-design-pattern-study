# Node.js Design Patterns

## Chapter 8 - GoF 디자인 패턴 (구조 패턴)

객체 간 연결 구조를 유연하게 만들어 확장성과 유지보수성을 높이는 패턴을 다루는 챕터

### 핵심 내용

구조 패턴 -> 객체들을 조합하여 더 큰 구조를 만드는 방법을 정의

"형식"보다는 해결하고자 하는 "문제(의도)"가 핵심

Node.js 환경에서의 구조 패턴 활용 -> 언어적 특성(함수 일급 객체, 동적 타이핑) 덕분에 유연한 구현 가능

- Proxy: 객체에 대한 접근을 제어하고 관리함
- Decorator: 객체의 기능을 동적으로 확장함
- Adapter: 호환되지 않는 인터페이스를 변환하여 협업 가능하게 함

---

## 1. Proxy Pattern

### 1.1 Proxy Pattern이란?

실제 객체 대신 요청을 받아 처리하는 대리(Proxy) 객체를 두는 구조

### 1.2 주요 목적

**객체 접근 제어 및 부가 기능 수행 -> 실제 객체 접근 전/후에 제어 로직 추가**

**리소스 관리 (Lazy Initialization) -> 필요할 때만 객체를 생성하여 메모리 절약**

```javascript
class RealDB {
  connect() {
    console.log("DB Connected");
  }
  query(sql) {
    return `Result: ${sql}`;
  }
}

class DBProxy {
  constructor() {
    this.db = null;
  }

  query(sql) {
    if (!this.db) {
      this.db = new RealDB();
      this.db.connect(); // Lazy Initialization
    }
    console.log("SQL LOG:", sql);
    return this.db.query(sql);
  }
}

// use case
const db = new DBProxy();
db.query("SELECT * FROM users");
```

**원래 객체 수정 없이 제어 흐름 추가 -> 테스트 용이성 및 교체 가능성 증대**

### 1.3 Node.js 실무 예

- 데이터 검증 (Validation)
- 보안 및 권한 확인 (NestJS Guards)
- 캐싱 및 로깅 (Caching Proxy)

---

## 2. Decorator Pattern

### 2.1 Decorator Pattern이란?

기존 객체를 수정하지 않고 동적으로 새로운 기능을 추가(확장)하는 패턴

### 2.2 주요 목적

**기능의 확장 -> 상속 대신 객체 감싸기(Composition)를 통해 유연하게 기능 추가**

**단일 책임 원칙(SRP) 준수 -> 핵심 로직과 부가 기능을 분리**

```javascript
function withRetry(fn, retries = 3) {
  return async (...args) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn(...args);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError;
  };
}

function withLog(fn) {
  return async (...args) => {
    console.log(`Call: ${fn.name}`);
    return fn(...args);
  };
}

async function fetchData() {
  throw new Error("Network Error!");
}

// use case - 기능 조합 (Composition)
const safeFetch = withLog(withRetry(fetchData, 2));
safeFetch().catch(console.error);
```

### 2.3 Node.js 실무 예

- Express / NestJS 미들웨어
- Logging, Retry 로직 등 횡단 관심사 처리

---

## 3. Proxy vs Decorator

### 3.1 Proxy vs Decorator 구분

기술적으로 유사(Wrapper)하나, **사용 의도(Intent)**에 따라 명확히 구분됨

| 구분            | Proxy Pattern                                     | Decorator Pattern                                   |
| :-------------- | :------------------------------------------------ | :-------------------------------------------------- |
| **핵심 의도**   | **접근 제어 (Access Control)**                    | **기능 확장 (Enhancement)**                         |
| **하는 일**     | 객체 접근을 가로채서 관리<br>(권한, 지연 로딩 등) | 객체 행동에 새로운 책임을 덧붙임<br>(로깅, 변환 등) |
| **실패 처리**   | 권한 없음 등으로 **실행 차단 가능**               | 원본 실행을 보장하며 결과/과정을 꾸밈               |
| **NestJS 예시** | Guards, Lazy Loading                              | Interceptors, Pipes                                 |

**판단 기준 -> "제어"가 목적인가(Proxy), "기능 추가"가 목적인가(Decorator)**

---

## 4. Adapter Pattern

### 4.1 Adapter Pattern이란?

호환되지 않는 인터페이스를 가진 객체들이 협업할 수 있도록 변환해주는 래퍼(Wrapper)

### 4.2 주요 목적

**인터페이스 호환성 해결 -> 기존 코드를 수정하지 않고 외부 라이브러리나 레거시 코드 통합**

```javascript
class KakaoSDK {
  sendKakao(payload) {
    console.log("Kakao:", payload);
  }
}

class MessagingAdapter {
  constructor(kakao) {
    this.kakao = kakao;
  }

  send(message) {
    // 클라이언트가 원하는 인터페이스로 변환
    return this.kakao.sendKakao({ text: message });
  }
}

// use case
const adapter = new MessagingAdapter(new KakaoSDK());
adapter.send("Hello Adapter!");
```

**기능 확장이 아닌 형식 변환이 핵심 -> PG사 연동, 구형 API 통합 등에 활용**

---

## 결론

Node.js 환경에서는 다양한 래핑 기법(Proxy, Decorator, Adapter)이 빈번하게 사용됨

**핵심은 "작은 것을 조합하라 (Composition over Inheritance)"는 철학을 실현하는 것**

각 패턴의 기술적 구현보다 **의도(Intent)**를 명확히 하여 책임을 분리하는 것이 중요함
