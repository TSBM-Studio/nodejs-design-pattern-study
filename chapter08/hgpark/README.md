# Chapter 8. Structural Design Patterns

구조 패턴(Structural Patterns)은 객체나 모듈을 조립하여 더 큰 구조를 만드는 방법을 다룬다. Node.js에서는 JavaScript의 동적 타입 시스템과 함수 중심 설계 덕분에 구조 패턴이 매우 강력하게 활용된다.

## 8.1 Proxy Pattern

### 8.1.1 정의

GoF의 정의

> Proxy는 다른 객체에 대한 접근을 제어하기 위한 대리 객체(surrogate)를 제공하는 패턴이다. Proxy는 원래 객체(Subject)와 동일한 인터페이스를 제공하며, 클라이언트의 요청을 가로채어 추가적인 로직을 수행할 수 있다.

Node.js 관점에서의 Proxy

Proxy 패턴은 실제 객체(Subject)에 대한 접근을 중간에서 가로채어 다음과 같은 기능을 수행한다:

- Data validation: 데이터 검증
- Security: 접근 권한 제어
- Caching: 결과 캐싱
- Lazy initialization: 지연 초기화
- Logging: 로깅 및 모니터링
- Remote objects: 원격 객체 래핑

Node.js에서는 ES6의 `Proxy` 객체를 활용하여 런타임에 동적으로 메서드 호출을 가로챌 수 있다.

### 8.1.2 Proxy 구현 기법

Proxy 패턴을 구현하는 주요 기법은 다음과 같다:

#### 1) Object composition (객체 조합)

Proxy 객체가 Subject를 내부 필드로 보유하고, 필요한 메서드만 오버라이드하며 나머지는 위임한다.

예제: StackCalculator와 SafeCalculator

```javascript
// Subject
class StackCalculator {
  constructor() {
    this.stack = []
  }

  putValue(value) {
    this.stack.push(value)
  }

  getValue() {
    return this.stack.pop()
  }

  peekValue() {
    return this.stack[this.stack.length - 1]
  }

  clear() {
    this.stack = []
  }

  divide() {
    const divisor = this.getValue()
    const dividend = this.getValue()
    const result = dividend / divisor
    this.putValue(result)
    return result
  }

  multiply() {
    const multiplicand = this.getValue()
    const multiplier = this.getValue()
    const result = multiplier * multiplicand
    this.putValue(result)
    return result
  }
}
```

```javascript
// Proxy using composition
class SafeCalculator {
  constructor(calculator) {
    this.calculator = calculator
  }

  // Intercept divide to add validation
  divide() {
    const divisor = this.calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return this.calculator.divide()
  }

  // Delegate all other methods
  putValue(value) {
    return this.calculator.putValue(value)
  }

  getValue() {
    return this.calculator.getValue()
  }

  peekValue() {
    return this.calculator.peekValue()
  }

  clear() {
    return this.calculator.clear()
  }

  multiply() {
    return this.calculator.multiply()
  }
}
```

사용 예시:

```javascript
const calculator = new StackCalculator()
const safeCalculator = new SafeCalculator(calculator)

safeCalculator.putValue(3)
safeCalculator.putValue(2)
console.log(safeCalculator.multiply()) // 6

safeCalculator.putValue(0)
safeCalculator.divide() // Error: Division by 0
```

#### 2) Object augmentation (객체 증강/몽키패칭)

기존 객체의 메서드를 직접 교체하는 방식이다. 빠르고 간단하지만 원본 객체를 변경하므로 주의가 필요하다.

```javascript
function patchToSafeCalculator(calculator) {
  const originalDivide = calculator.divide
  calculator.divide = () => {
    const divisor = calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return originalDivide.apply(calculator)
  }
  return calculator
}
```

#### 3) ES6 Proxy 객체

ES6의 `Proxy` 객체를 사용하면 모든 객체 접근을 동적으로 가로챌 수 있다.

```javascript
const safeCalculatorHandler = {
  get(target, property) {
    if (property === 'divide') {
      // Intercept divide method
      return function() {
        const divisor = target.peekValue()
        if (divisor === 0) {
          throw Error('Division by 0')
        }
        return target.divide()
      }
    }
    // Delegate everything else
    return target[property]
  }
}

const calculator = new StackCalculator()
const safeCalculator = new Proxy(calculator, safeCalculatorHandler)
```

ES6 Proxy 함수:

- `get`: 속성 읽기 가로채기
- `set`: 속성 쓰기 가로채기
- `apply`: 함수 호출 가로채기
- `construct`: new 연산자 가로채기
- `has`: in 연산자 가로채기

### 8.1.3 실전 예시: Writable stream 로깅 Proxy

책에서 제시하는 실전 예시는 Writable stream에 로깅을 추가하는 것이다.

```javascript
function createLoggingWritable(writable) {
  return new Proxy(writable, {
    get(target, propKey) {
      if (propKey === 'write') {
        return function(...args) {
          const [chunk] = args
          console.log('Writing:', chunk)
          return target.write(...args)
        }
      }
      return target[propKey]
    }
  })
}
```

### 8.1.4 Change Observer Pattern with Proxy

Proxy를 활용하여 객체의 변경을 관찰하는 패턴을 구현할 수 있다.

```javascript
function createObservable(target, observer) {
  const observable = new Proxy(target, {
    set(obj, prop, value) {
      const prev = obj[prop]
      obj[prop] = value
      observer({ prop, prev, curr: value })
      return true
    }
  })
  return observable
}

// Usage
const user = { name: 'John', age: 30 }
const observableUser = createObservable(user, ({ prop, prev, curr }) => {
  console.log(`${prop} changed from ${prev} to ${curr}`)
})

observableUser.age = 31 // age changed from 30 to 31
```

### 8.1.5 장단점

장점

- 접근 제어, 검증, 로깅, 캐싱을 비침투적 방식으로 구현
- 기존 객체의 구조를 변경하지 않음
- 런타임에 동적으로 행동을 변경할 수 있음

단점

- 디버깅이 어려울 수 있음 (호출 스택이 복잡해짐)
- 성능 오버헤드 발생 가능 (특히 ES6 Proxy)
- 몽키패칭 방식은 충돌 위험이 있음
- ES6 Proxy의 트랩(`get`, `set` 등)은 동기적으로 실행되므로 트랩 내부에 heavy한 연산이 있으면 Event Loop를 블로킹할 수 있다.

### 8.1.6 사용 시점

Proxy 패턴은 다음과 같은 경우에 사용한다:

- 메서드 호출 전후에 검증이 필요할 때
- 접근 권한 체크가 필요할 때
- 비용이 큰 객체의 lazy initialization
- 원격 객체를 로컬 객체처럼 다루고 싶을 때 (RPC)
- 캐싱, 로깅, 성능 측정 등의 횡단 관심사(cross-cutting concerns) 처리

### 8.1.7 JVM(Spring) vs Node.js에서의 Proxy 패턴 사용 차이

JVM 환경, 특히 Spring Framework에서는 Proxy 패턴이 프레임워크의 핵심 메커니즘이지만, Node.js에서는 상대적으로 덜 사용된다. 그 이유와 구체적인 차이점을 살펴보자.

#### JVM(Spring)에서의 Proxy 사용 예시

Spring Framework의 핵심 기능들은 대부분 동적 프록시(Dynamic Proxy)를 기반으로 한다:

**@Transactional - 트랜잭션 자동 관리**

```java
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Transactional  // <- Spring이 이 메서드를 Proxy로 감쌈
    public User createUser(String name, String email) {
        User user = new User(name, email);
        userRepository.save(user);
        
        // 만약 여기서 예외 발생하면 자동 롤백
        sendWelcomeEmail(email);
        
        return user;
    }
}

// Spring이 런타임에 생성하는 Proxy (개념적 표현)
public class UserService$$Proxy {
    public User createUser(String name, String email) {
        tx.begin();  // 자동으로 추가됨
        try {
            User result = original.createUser(name, email);
            tx.commit();  // 자동으로 추가됨
            return result;
        } catch (Exception e) {
            tx.rollback();  // 자동으로 추가됨
            throw e;
        }
    }
}
```

이 외에도 `@Cacheable`(캐싱), `@Async`(비동기), `@PreAuthorize`(권한) 등 대부분의 Spring 기능이 Proxy 기반이다.

#### Node.js에서의 Proxy 사용 예시

Node.js에서도 Proxy를 사용할 수 있지만, 주로 특정 유스케이스에 한정된다:

**Logging/Debugging Proxy**

```javascript
function createLoggingProxy(target, name) {
  return new Proxy(target, {
    get(target, prop) {
      if (typeof target[prop] === 'function') {
        return new Proxy(target[prop], {
          apply(fn, thisArg, args) {
            console.log(`[${name}.${prop}] called with:`, args)
            const result = fn.apply(thisArg, args)
            console.log(`[${name}.${prop}] returned:`, result)
            return result
          }
        })
      }
      return target[prop]
    }
  })
}

const userService = createLoggingProxy(new UserService(), 'UserService')
userService.createUser('John', 'john@example.com')
// [UserService.createUser] called with: ['John', 'john@example.com']
// [UserService.createUser] returned: { id: 1, name: 'John', ... }
```

하지만 실무에서는 이런 기능도 보통 Proxy 대신 **데코레이터나 미들웨어**로 구현한다.

#### Node.js에서 Proxy를 덜 사용하는 이유

**1. 언어 차이 - 정적 vs 동적**

```javascript
// JavaScript는 이미 동적 언어라 함수를 직접 감싸기 쉬움
function withTransaction(fn) {
  return async function(...args) {
    const tx = await db.beginTransaction()
    try {
      const result = await fn(...args)
      await tx.commit()
      return result
    } catch (e) {
      await tx.rollback()
      throw e
    }
  }
}

// Proxy 없이도 트랜잭션 기능 추가 가능
const createUser = withTransaction(async (name) => {
  return await db.users.insert({ name })
})
```

**2. 데코레이터와 고차함수 선호**

Node.js에서는 Proxy 대신 함수형 패턴을 더 선호한다:

```javascript
// Node.js는 함수 조합으로 동일한 효과
const getUser = compose(
  withCache('users'),
  withTransaction,
  withRetry(3)
)(async (id) => await db.users.findById(id))
```

**3. 미들웨어 패턴의 우세**

Node.js 생태계는 미들웨어 패턴이 매우 발달했다:

```javascript
// Node.js는 미들웨어 패턴이 발달 (Proxy 불필요)
app.use(authenticate)
app.use(authorize('admin'))
app.use(logger)

app.post('/users', async (req, res) => {
  // 모든 미들웨어를 통과한 후 실행
})

// Spring에서는 이런 기능을 Proxy로 구현
@PreAuthorize("hasRole('ADMIN')")
@Loggable
@Cacheable
public void createUser() { ... }
```

**4. 성능 오버헤드**

ES6 Proxy는 직접 접근보다 약 10배 느리다. Node.js의 싱글 스레드 이벤트 루프에서는 이런 오버헤드가 더 치명적이다.

**5. 의존성 주입 방식의 차이**

Spring은 컨테이너가 자동으로 Proxy를 주입하지만, Node.js는 대부분 명시적으로 실제 객체를 주입한다.

**6. 명시적 코드 철학**

Node.js 커뮤니티는 암시적인 Proxy보다 명시적이고 투명한 코드를 선호한다. "마법 같은" 동작보다는 코드만 봐도 동작을 이해할 수 있는 것을 중요하게 여긴다.

#### NestJS: Node.js의 예외

NestJS는 Node.js에서 Spring 스타일의 Decorator를 적극 사용하는 프레임워크다. 하지만 실제로는 TypeScript Decorator를 주로 사용하고, 런타임 Proxy는 제한적으로만 사용한다.

#### 정리: 왜 Node.js에서 Proxy를 덜 쓰는가?

| 항목 | JVM/Spring | Node.js |
|------|------------|---------|
| **언어 특성** | 정적 타입, 컴파일 | 동적 타입, 런타임 |
| **메타프로그래밍** | 어노테이션 + Proxy | 함수 조합, 데코레이터 |
| **DI 컨테이너** | 필수 (자동 Proxy) | 선택적 (수동 조립) |
| **횡단 관심사** | AOP (Proxy 기반) | 미들웨어 패턴 |
| **성능 민감도** | 상대적으로 덜 민감 | 매우 민감 (이벤트 루프) |
| **개발 철학** | 선언적, 암시적 | 명시적, 투명성 선호 |

**결론:**

- **Spring**: 프레임워크가 Proxy를 자동으로 생성하여 개발자가 비즈니스 로직에만 집중하도록 함
- **Node.js**: 명시적이고 투명한 코드를 선호하며, 고차함수와 미들웨어로 동일한 효과 달성
- **성능**: Node.js의 싱글 스레드 모델에서 Proxy 오버헤드는 더 치명적
- **생태계**: Node.js 생태계는 함수형 프로그래밍과 조합 가능한 패턴을 더 선호

따라서 Node.js에서 Proxy 패턴은 "할 수 있지만 굳이 안 하는" 케이스가 많다. 동일한 기능을 더 간단하고 명시적인 방법으로 구현할 수 있기 때문이다.

## 8.2 Decorator Pattern

### 8.2.1 정의

GoF의 정의

> Decorator는 객체에 동적으로 새로운 책임을 추가하는 패턴이다. 서브클래싱 대신 유연한 대안을 제공하여 기능을 확장한다.

Node.js 관점에서의 Decorator

Decorator는 기존 객체를 감싸서 새로운 기능을 덧붙이는 패턴이다. Proxy와 구조적으로 유사하지만, 목적이 접근 제어보다는 기능 확장(augmentation)에 있다는 점이 다르다.

Node.js 생태계에서는 플러그인 시스템, 미들웨어 패턴과 매우 잘 어울린다.

### 8.2.2 Decorator 구현 기법

#### 1) Composition (객체 조합)

```javascript
class EnhancedCalculator {
  constructor(calculator) {
    this.calculator = calculator
  }

  // Add new method
  add() {
    const addend1 = this.calculator.getValue()
    const addend2 = this.calculator.getValue()
    const result = addend1 + addend2
    this.calculator.putValue(result)
    return result
  }

  // Also enhance existing method
  divide() {
    // Add validation
    const divisor = this.calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return this.calculator.divide()
  }

  // Delegate other methods
  putValue(value) {
    return this.calculator.putValue(value)
  }

  getValue() {
    return this.calculator.getValue()
  }

  peekValue() {
    return this.calculator.peekValue()
  }

  clear() {
    return this.calculator.clear()
  }

  multiply() {
    return this.calculator.multiply()
  }
}
```

#### 2) Object augmentation (몽키패칭)

```javascript
function patchCalculator(calculator) {
  // Add new method
  calculator.add = function() {
    const addend1 = this.getValue()
    const addend2 = this.getValue()
    const result = addend1 + addend2
    this.putValue(result)
    return result
  }

  // Enhance existing method
  const originalDivide = calculator.divide
  calculator.divide = function() {
    const divisor = this.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return originalDivide.apply(this)
  }

  return calculator
}
```

#### 3) ES6 Proxy를 이용한 Decorator

```javascript
function enhanceCalculator(calculator) {
  return new Proxy(calculator, {
    get(target, prop) {
      if (prop === 'add') {
        return function() {
          const addend1 = target.getValue()
          const addend2 = target.getValue()
          const result = addend1 + addend2
          target.putValue(result)
          return result
        }
      }
      if (prop === 'divide') {
        return function() {
          const divisor = target.peekValue()
          if (divisor === 0) {
            throw Error('Division by 0')
          }
          return target.divide()
        }
      }
      return target[prop]
    }
  })
}
```

### 8.2.3 실전 예시: LevelUP 플러그인

책에서는 LevelUP 데이터베이스에 플러그인을 추가하는 예제를 제시한다. LevelUP은 key-value 저장소인데, 여기에 publish-subscribe 기능을 추가하는 방식이다.

```javascript
export function levelSubscribe(db) {
  db.subscribe = (pattern, listener) => {
    db.on('put', (key, val) => {
      const match = Object.keys(pattern).every(
        k => pattern[k] === val[k]
      )
      if (match) {
        listener(key, val)
      }
    })
  }
  return db
}
```

사용:

```javascript
import level from 'level'
import { levelSubscribe } from './level-subscribe.js'

const db = levelSubscribe(
  level('example-db', { valueEncoding: 'json' })
)

db.subscribe(
  { doctype: 'tweet', language: 'en' },
  (key, val) => console.log('New English tweet:', val)
)

db.put('1', { doctype: 'tweet', text: 'Hi', language: 'en' })
// New English tweet: { doctype: 'tweet', text: 'Hi', language: 'en' }
```

### 8.2.4 Decorator의 조합 (Composing decorators)

여러 Decorator를 조합하여 사용할 수 있다:

```javascript
const enhancedCalculator = enhanceCalculator(
  levelSubscribe(
    new StackCalculator()
  )
)
```

### 8.2.5 장단점

장점

- 기능을 동적이고 조합적으로 확장 가능
- 기존 객체를 수정하지 않고 기능 추가 (Open-Closed Principle)
- 플러그인 시스템 구축에 적합
- 단일 책임 원칙(SRP) 준수

단점

- Decorator 중첩 시 호출 체인이 복잡해짐
- 몽키패칭 방식은 충돌 위험
- 디버깅 어려움

### 8.2.6 사용 시점

- 확장 가능한 플러그인 API를 만들 때
- 여러 기능(로깅, 캐싱, 검증 등)을 조합해야 할 때
- 외부 라이브러리의 기능을 보완할 때
- 기존 코드를 수정하지 않고 기능을 확장해야 할 때

### 8.2.7 Proxy vs Decorator

두 패턴은 구조적으로 매우 유사하지만 의도가 다르다:

| 특성 | Proxy | Decorator |
|------|-------|-----------|
| 목적 | 접근 제어 | 기능 확장 |
| 인터페이스 | Subject와 동일 | 새로운 메서드 추가 가능 |
| 주요 용도 | 검증, 보안, lazy init | 기능 추가, 조합 |
| 관계 | has-a (위임) | has-a (위임) |

## 8.3 Adapter Pattern

### 8.3.1 정의

GoF의 정의

> Adapter는 호환되지 않는 인터페이스를 가진 클래스들이 함께 동작할 수 있도록 인터페이스를 변환하는 패턴이다.

Node.js 관점에서의 Adapter

Adapter는 외부 라이브러리나 레거시 코드의 인터페이스를 현재 시스템에 맞게 변환할 때 사용한다. Node.js에서 가장 흔한 예는 콜백 기반 API를 Promise 기반 API로 변환하는 것이다.

### 8.3.2 예제: fs를 Promise 기반으로 변환

콜백 기반 fs를 Promise로 변환:

```javascript
import { promisify } from 'util'

export function createFSAdapter(fs) {
  return {
    readFile: promisify(fs.readFile),
    writeFile: promisify(fs.writeFile),
    // ... other methods
  }
}
```

### 8.3.3 실전 예시: LevelUP을 다른 데이터베이스 백엔드로 적응

책에서는 LevelUP을 여러 스토리지 백엔드(filesystem, IndexedDB, Redis 등)에 맞게 적응시키는 예제를 제시한다.

```javascript
import level from 'level'
import levelup from 'levelup'
import memdown from 'memdown'

// Filesystem backend
const dbFs = level('./my-db')

// In-memory backend (useful for testing)
const dbMem = levelup(memdown())
```

이처럼 동일한 인터페이스를 유지하면서 백엔드 구현을 교체할 수 있다.

### 8.3.4 장단점

장점

- 기존 코드를 재사용할 수 있음
- 외부 API와의 통합이 용이
- 인터페이스 호환성 유지
- 레거시 코드 마이그레이션에 유용

단점

- Adapter 레이어가 많아지면 구조가 복잡해짐
- 추가적인 추상화 레벨로 인한 오버헤드

### 8.3.5 사용 시점

- 외부 패키지/라이브러리의 인터페이스가 요구사항과 맞지 않을 때
- 콜백 기반 코드를 Promise/async-await로 변환할 때
- 서로 다른 시스템을 통합할 때
- 점진적 마이그레이션이 필요할 때

