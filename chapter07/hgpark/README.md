# Chapter7: 생성자 디자인 패턴

## Factory

### 객체 생성과 구현의 분리

#### 전통적인 Factory 메서드 패턴

- 객체의 생성에 대한 책임을 서브 클래스 혹은 별도의 팩토리 메서드(creator) 에 위임한다
- 상위 클래스는 객체 생성 인터페이스만 제공, 서브클래스(메서드) 가 어떤 구체적인 메서드를 생성할지 결정

Factory 패턴은 객체 생성 방식을 한 곳에 모아두어, 객체 생성 로직과 객체 자체의 구현을 분리하는 역할을 한다.

Node.js/JS는 `new`를 직접 호출해도 객체를 만들 수 있으나, 이를 직접 노출하면 다음과 같은 문제가 생긴다:

- 특정 클래스에 코드가 고정됨
- 생성 방식 변경 시 모든 호출 지점을 수정해야 함
- 조건부 생성, 환경별 생성(예: `NODE_ENV=production`일 때 다른 객체) 등이 어렵다

Factory 함수를 이용하면 다음과 같은 이점이 있다:

- 어떤 구현체를 생성할지 런타임 조건으로 결정 가능
- 호출자는 “무엇을 생성하는지”만 알면 되고 “어떻게 생성하는지”는 몰라도 된다
- 클래스 대신 함수, 클로저, 객체 리터럴, duck-typed 객체 등 어떤 형태를 반환해도 무방함
- 라이브러리/프레임워크에서 생성자를 감추어 구현 세부사항을 숨기고 surface area를 줄일 수 있음

예시: 파일 확장자에 따라 다른 Image 클래스를 생성하는 예제

- JPEG, GIF, PNG 등 확장자마다 별도 클래스로 나뉘어도
  `createImage(name)` 라는 Factory만 유지되면 기존 코드는 변경 필요 없음.

### 캡슐화를 강제하기 위한 메커니즘

Factory는 객체 반환 시 클로저(closure)를 적극 활용하여 private 상태를 은닉할 수 있다.

예:

```js
function createPerson(name) {
  const privateProperties = {};
  const person = {
    setName(){...},
    getName(){...}
  }
  return person;
}
```

여기서 `privateProperties`는 외부 어디에서도 접근할 수 없다.
즉, JS의 함수 스코프 + 클로저 조합은 전통적 OOP의 private 필드보다 더 강력한 은닉이 가능하다.

### 간단한 코드 프로파일러 만들기

환경(NODE_ENV)에 따라 다른 구현체를 반환하는 Factory 예제:

```js
createProfiler(node_env) → 
  prod 환경이면 mockedProfiler (start/end 빈 함수)
  dev 환경이면 실제 Profiler 인스턴스
```

이 경우 Factory는 다음을 보장한다:

- 호출자는 profiler.start(), end()만 알면 됨
- 성능 측정 기능을 끄거나 켤 때 코드 변경이 필요 없음
- Factory가 반환하는 객체가 Class instance인지 단순 객체인지도 호출자는 신경 쓸 필요 없음 (duck typing)

---

## Builder

### URL 객체 빌더

Builder 패턴은 복잡한 객체를 단계적(fluid)으로 구축하는 수단을 제공한다.

“어떻게 만들지는 Builder가 책임지고, 무엇을 만들지는 Director가 조립만 한다”.

구성 요소는 보통 다음 네 가지다:

- Builder

  - 객체를 만들기 위한 단계적 API 제공

- Concrete Builder

  - Builder를 구현한 실제 생성자
  - 내부적으로 객체의 각 부분을 조립

- Director

  - Builder의 메서드를 호출하는 순서를 정의
  - "이런 절차로 만들어라"라는 생성 알고리즘을 제공

- Product
  - 최종 생성되는 복잡한 객체

전통적 생성자:

```js
new Url(host, path, query, secure, method, port)
```

처럼 인자가 많아지면 직관성이 떨어진다.

Builder는 다음과 같은 이점을 제공한다:

```js
const url = UrlBuilder()
  .setHost("example.com")
  .setPath("/posts")
  .setQuery({ page: 3 })
  .setSecure(true)
  .build()
```

특징:

- 메서드 체이닝으로 가독성이 높다
- 조합 가능한 옵션 설정에 적합
- Node.js에서는 객체 리터럴 생성이 매우 자유롭기 때문에 Builder 구현이 부담이 적다
- async Builder도 쉽게 만들 수 있어 I/O 초기화도 단계별 제어 가능
- 클로저로 빌더 내부 상태를 은닉하면 외부 조작을 차단할 수 있다.

일반적으로 builder 패턴에서의 함수들은 this를 리턴한다.

---

## 공개 생성자

### immutable 버퍼 만들기

Revealing Constructor 패턴은 전통적 패턴이 아닌 **JS의 언어 특성(클로저)을 활용한 독자 패턴**이다.

핵심:

- 객체 생성 시점에는 내부 정보를 “잠깐” 공개하여 초기화에 사용하고
- 생성 이후에는 접근할 수 없도록 은닉
- 즉, 생성 과정에만 특별한 권한을 허용하는 방식

immutable buffer 예시:

- 내부에 원본 데이터를 private 영역(클로저)에 보관
- 외부에서는 읽기 전용 API만 제공하고
- `set`이나 `write` 같은 메서드는 아예 제공하지 않음
- 호출자가 원본을 수정할 수 없으므로 불변성 보장

이 패턴은 다음 상황에 유용하다:

- 보안적으로 민감한 데이터를 생성 시점 이후 외부로부터 격리
- API 사용자에게 특정 상태 변경을 막아야 할 때
- Node.js 모듈을 배포할 때 내부 동작을 숨겨야 할 때

전통적 멀티스레드 언어에서는 private 필드가 reflection 등으로 접근 가능한 경우가 많다.
JS 클로저 기반 은닉은 실제로 더 강력한 보호를 제공한다.

---

## 싱글톤

### 싱글톤 (GoF)

싱글톤 패턴은 어떤 클래스의 인스턴스가 단 하나만 존재하도록 보장하고,
그 인스턴스에 전역적으로 접근할 수 있는 방법을 제공하는 패턴이다.

전통적 OOP 관점에서는 다음 두 조건을 만족해야 한다:

- 인스턴스가 한 번만 생성됨
  - private 생성자를 사용하여 외부 new 금지
  - 내부 static 메서드에서 최초 한 번만 생성

- 전역 접근 가능한 단일 인스턴스 제공
  - 보통 Class.getInstance() 형태
  - 애플리케이션 어디서든 동일한 인스턴스를 공유

장점:

- 전역적으로 하나만 있어야 하는 리소스 관리
- 인스턴스 생성 비용이 높은 경우 생성 비용 절감
- 전역 상태 공유

단점:

- 전역 상태로 인해 숨겨진 의존성 (아래와 같은 이유로 DI가 선호되기도 함)
  - 의존성을 명확하게 드러내지 않아 추적/유지보수 어려움
  - 테스트하기 어려움
  - 모듈간 결합도 증가

- 전역 상태 공유로 경쟁
  - 여러 스레드가 동일한 싱글톤 객체의 상태를 공유할 경우 -> lock 필요

### 싱글톤 (Node)

Node.js에서의 싱글톤은 일반 OOP 언어와 다르게 작동한다.

- Node.js는 **모듈을 캐싱**하므로, 특정 모듈에서

  ```js
  export const db = new Database()
  ```

  라고 작성하면 이를 import하는 모든 파일은 동일한 인스턴스를 공유한다.

- 즉, 특별한 싱글톤 코드 없이도 “사실상 싱글톤”이 된다.

그러나 주의해야 할 점이 있다:

- npm 의존성 트리에서 동일한 패키지가 버전 충돌로 여러 번 설치되면,
  각 패키지는 독립된 node_modules 아래에서 로드되므로 Singleton이 깨진다.
- 진정한 글로벌 싱글톤이 필요하면 정말 `global.*`에 저장해야 한다.
  단, 이 경우 오염 및 충돌 위험이 있다.

싱글톤은 다음에 적합하다:

- DB connection
- Shared configuration
- Connection pool
- 전역 캐시 등

하지만 너무 많은 상태를 싱글톤에 보관하면 이벤트루프에서 모든 요청이 공유 상태에 접근하게 되어 병목이 발생할 수 있다.

---

## 모듈 와이어링

모듈 간의 의존성을 연결하는 방식에는 대표적으로 두 가지가 있다:

### Singleton을 통한 Wiring

가장 단순한 방식:

- db.js:

  ```js
  export const db = new sqlite3.Database(...)
  ```

- blog.js 는 위의 db 객체를 그냥 import
- 모든 blog 인스턴스는 동일한 db를 사용

장점:

- 매우 단순
- 설정이 거의 필요 없음

단점:

- 테스트하기 힘듦
- 다른 DB를 사용하고 싶을 때(테스트용 InMemory DB 등) 교체가 어려움
- 모듈이 강결합 된다

### 2) Dependency Injection(DI)를 통한 Wiring

블로그 예제를 DI 방식으로 만들면:

- Blog 클래스는 constructor(db)를 받는다
- db는 외부 injector에서 전달
- injector는 실제 DB든 mock DB든 원하는 객체를 Blog에 주입 가능

장점:

- 테스트 편함
- 모듈 재사용/확장 용이
- 의존성을 교체하거나 업그레이드하기 쉽다

단점:

- 코드 구조가 다소 복잡해짐
- 작은 프로젝트에서 과도한 구조가 될 수 있음

Node.js는 인터페이스가 없으므로, Blog가 받는 db는 “duck typing”으로 판단한다.
즉, `run()`, `all()` 메서드를 구현하면 그게 DB이다.

---

## 추가 (스코프/클로저/이벤트루프/메모리/멀티스레드 대비 분석)

### 스코프와 클로저 활용

- Factory/Builder/비공개 생성자 패턴은 **함수 스코프 + 클로저**를 적극적으로 활용한다.
- JS에서는 스코프 단위로 private 상태가 형성되므로, 객체를 생성할 때 내부 상태를 자연스럽게 은닉할 수 있다.
- 이는 전통적 클래스 기반 private보다 더 강력한 정보 은닉 제공.

### 이벤트 루프 관점

- Node.js는 싱글스레드 이벤트루프 기반이기 때문에 객체 상태 경쟁(race condition)이 없다.
- 따라서 Creational 패턴이 생성한 shared object(Singleton 등)는 lock 없이 안전하게 접근된다.
- 하지만 mutable singleton state가 많으면 이벤트 루프 내에서 논리적 병목이 생길 수 있어 설계에 주의해야 한다.

### 메모리 관점

- 클로저는 스코프를 유지하므로, private 상태가 많을수록 GC pressure 증가 가능
- long-lived closure(특히 Singleton 안에 클로저 기반 비공개 상태)가 많으면 메모리 누수처럼 보일 수도 있다
- Builder는 주로 ephemeral object이기 때문에 메모리 부담 적음

### 전통적 멀티스레드 언어와의 차이

| 측면             | Node.js            | Java/C#/C++ 등                   |
| -------------- | ------------------ | ------------------------------- |
| 객체 생성          | new 또는 함수 기반 동적 생성 | new + 클래스 필수                    |
| private        | 클로저로 완벽 은닉         | private여도 reflection 가능         |
| 싱글톤            | 모듈 캐시로 사실상 자동      | static 필드 + thread-safe init 필요 |
| race condition | 없음 (싱글스레드)         | 멀티스레드라 lock 필요                  |
| DI             | 선택 사항, duck typing | 인터페이스 기반 DI 필수 구성 요소            |

Node.js에서는 Creational 패턴이 멀티스레드 언어보다 더 단순하고 유연하며 기능적으로 강력하다.
