## [7.1 팩토리]

### 7.1.1 객체 생성과 구현의 분리

팩토리: 새 인스턴스 생성을 감싸서 객체 생성 시 더 많은 유연성과 제어 제공

- new 연산자로 새 인스턴스 생성
- 클로저로 상태를 기억하는 객체 리터럴 동적 작성
- 특정 조건에 따라 다른 유형의 객체 반환
- 클래스를 숨겨 확장, 수정을 막아줌

```jsx
function createImage(name) {
  if (name.match(~) {
    return new ImageJpeg(naem)
  } else if (name.match(~) {
    return new ImageGif(name)
  } else {
     throw new Error('Unsupported format')
	}
}
```

### 7.1.2 캡슐화를 강제할 수 있는 메커니즘

캡슐화: 외부 코드가 컴포넌트의 내부 핵심에 직접 접근하여 조작하는 것을 방지하기 위해 접근을 제어하는 것

- js에서 주로 함수 스코프, 클로저를 통해 구현

## [7.2 빌더]

빌더: fluent interface를 제공하여 복잡한 객체의 생성을 단순화하는 생성 디자인 패턴

- 인자의 목록이 길거나, 복잡한 매개변수를 입력으로 사용하는 생성자가 있는 경우 유용하다

```jsx
const myBoat = new BoatBuilder()
  .withMotors(2, "Best Motor Co", "12")
  .withSails(1, "fabric", "white")
  .withCabin()
  .hullColor("blue")
  .build();
```

- 일반적인 규칙
  - 복잡한 생성자를 더 읽기 쉽고 관리하기 쉬운 여러 단계로 나눈다.
  - 한번에 관련된 여러 매개 변수들을 설정할 수 있는 빌더 함수를 만든다.
  - setter 함수를 통해 입력받을 값이 무엇일지 명확히 하고, 빌더 인터페이스를 사용하는 사용자가 알 필요가 없는 파라미터를 셋팅하는 더 많은 로직을 setter 함수 내에 캡슐화한다.
  - 형 변환, 정규화, 추가적인 유효성 검사 같은 조작을 추가할 수 있다.

## [7.3 공개 생성자]

객체가 생성되는 순간에만 객체의 내부적인 기능의 일부를 노출시킨다.

- 세가지 기본 요소
  - 실행자 (생성 시 호출되는 함수)
  - 생성자 (입력)
  - 공개 멤버 변수들 (함수에 전달되는 객체 내부의 필요 변수들)
- ImmutableBuffer 예제

```jsx
const MODIFIER_NAMES = ["swap", "write", "fill"];

export class ImmutableBuffer {
  constructor(size, executor) {
    const buffer = Buffer.alloc(size);
    const modifiers = {};
    for (const prop in buffer) {
      if (typeof buffer[prop] !== "function") {
        continue;
      }

      if (MODIFIER_NAMES.some((m) => prop.startsWith(m))) {
        modifiers[prop] = buffer[prop].bind(buffer);
      } else {
        this[prop] = buffer[prop].bind(buffer);
      }
    }

    executor(modifiers);
  }
}
```

밖(외부 코드)에서는 절대 변경 불가

→ ImmutableBuffer는 사실상 ‘immutable(read-only)’처럼 보임

- 공개 생성자 패턴 대표 예: Promise

```jsx
new Promise(function executor(resolve, reject) {
  // resolve = 성공 시 호출하는 함수
  // reject  = 실패 시 호출하는 함수

  resolve("ok");
});
```

## [7.4 싱글톤]

싱글톤 패턴의 목적: 클래스의 인스턴스가 하나만 존재하도록 접근을 중앙 집중화하는 것

- 상태 정보의 공유
- 리소스 사용의 최적화
- 리소스에 대한 접근 동기화

사용할 때

- export 로 내보내고 import 하는 것만으로도 싱글톤 구현 가능
- Nodejs는 모듈을 캐시하여 불러올 때마다 코드를 다시 읽지 않는다.

종속성 호이스팅

- 서로 호환되는 두 버전의 패키지를 필요로 하는 경우, 패키지 관리자가 최상위 node_modules 디렉터리에 설치하고 동일한 인스턴스를 공유하도록 한다.

여러 버전의 종속성이 필요한 경우

- global.dbInstance 를 사용하지 않으면 싱글톤을 구현하기 어렵다.
- global 변수를 사용한다면 패키지 내에서가 아닌 전체 애플리케이션에서 공유되는 유일한 인스턴스임을 보장할 수 있다.
- Nodejs는 모듈화된 하위 컴포넌트로부터 싱글톤으로 생성하여 임포트한다.

## [7.5 모듈 와이어링(Wiring)]

- 종속성
  - A가 B를 필요로 할 때, A는 B에 종속적이다. B는 A의 종속성 이라고 한다.

### 7.5.1 싱글톤 종속성

- Nodejs의 모듈 시스템을 활용한다.
- 간단하고 가독성이 높지만, mock 테스트를 어렵게 만든다.

### 7.5.2 종속성 주입 (DI)

- 종속성 주입: 컴포넌트들의 종속성들이 인젝터라고 하는 외부 요소에 의해 공급되는 간단한 패턴이다.
- 인젝터는 다른 컴포넌트를 초기화하고 종속성들을 함께 연결한다. 서비스에 대한 종속성을 충족하는 인스턴스를 제공하는 것을 목표로 한다.
- 종속성이 모듈에 하드코딩되는 대신 외부에서 주입된다.
- blog 모듈은 데이터베이스 구현에서 완전히 분리되어 보다 설정이 가능하고 구성요소들이 격리된 상태로 테스트가 용이하다.
- 장점: 디커플링, 재사용성
- 단점: 컴포넌트 간의 관계를 이해하기 어려워진다.
