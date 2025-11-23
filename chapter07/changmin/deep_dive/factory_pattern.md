# Factory Pattern에 대한 이런저런 생각들

## 1. Factory Pattern vs Strategy Pattern

둘 다 `if-else`나 `switch` 문을 사용하여 **"무언가를 선택한다"**는 점이 비슷해서 헷갈리기 쉽다. 하지만 **"목적"**과 **"결과물"**이 완전히 다르다.

| 비교          | Factory Pattern (공장)                       | Strategy Pattern (전략)                            |
| :------------ | :------------------------------------------- | :------------------------------------------------- |
| **핵심 질문** | "어떤 **객체**를 만들 것인가?"               | "어떤 **방식(알고리즘)**으로 행동할 것인가?"       |
| **결과물**    | 새로운 **인스턴스(객체)** (`return new Obj`) | 특정 **행동의 실행** (`run()`)                     |
| **비유**      | 자판기 (동전 넣으면 콜라/사이다 나옴)        | 운전 모드 (스포츠 모드/에코 모드로 주행 방식 변경) |

**코드 관점 차이**

- **Factory:** 조건에 맞는 `Logger` 객체를 생성해서 던져줌. (생성 책임)
- **Strategy:** 이미 있는 `Logger`에게 "파일에 적어" 혹은 "콘솔에 찍어"라고 행동 지침을 줌. (행동 위임)

---

## 2. Factory Pattern에는 어떤 것들이 있을까?

자바스크립트/Node.js에서는 엄격한 클래스 구조보다 유연한 방식을 선호하므로, 아래 개념들이 혼재되어 사용된다.

### 2.1 Simple Factory

그냥 함수 하나가 `switch` 문으로 객체를 반환하는 형태. 패턴이라기보다 관용구에 가깝지만 JS에선 제일 많이 씀

```javascript
function createAuth(type) {
  if (type === "google") return new GoogleAuth();
  if (type === "kakao") return new KakaoAuth();
}
```

### 2.2 정적 팩토리 메서드

클래스 내부에 `static` 메서드를 정의하여 생성자(`new`) 대신 객체를 생성하게 하는 방식

- **장점 1 (가독성):** `new Color(255, 0, 0)` vs `Color.createRed()` -> 이름이 있으니 명확함
- **장점 2 (유연성):** 호출할 때마다 반드시 새로운 객체를 만들 필요가 없음 (캐싱 가능)

```javascript
class Color {
  constructor(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  // 정적 팩토리 메서드
  static createRed() {
    return new Color(255, 0, 0);
  }
}

const red = Color.createRed();
```

### 2.3 팩토리 메서드 패턴

부모 클래스는 "객체를 만든다"는 인터페이스만 제공하고, **실제 어떤 객체를 만들지는 자식 클래스가 결정**함 (상속 활용)

```javascript
// 1. Creator
class Logistics {
  // 팩토리 메서드 (구현은 자식에게 위임)
  createTransport() {
    throw new Error("서브 클래스에서 구현해야 합니다.");
  }

  planDelivery() {
    // 자식이 뭘 만들든(Truck? Ship?) 상관없이 공통 로직 수행 가능
    const transport = this.createTransport();
    transport.deliver();
  }
}

// 2. Concrete Creator
class RoadLogistics extends Logistics {
  createTransport() {
    return new Truck();
  }
}

// 3. Concrete Creator
class SeaLogistics extends Logistics {
  createTransport() {
    return new Ship();
  }
}

// 4. Products
class Truck {
  deliver() {
    console.log(" 도로로 배달");
  }
}
class Ship {
  deliver() {
    console.log("바다로 배달");
  }
}

// 사용
const logistics = new RoadLogistics();
logistics.planDelivery(); // "도로로 배달"
```

### 2.4 추상 팩토리 패턴

연관된 객체들의 **"제품군(Family)"**을 생성하는 인터페이스를 제공
(예: `DarkThemeFactory` -> 다크 버튼, 다크 윈도우 생성 / `LightThemeFactory` -> 라이트 버튼, 라이트 윈도우 생성)

```javascript
// 1. Abstract Factory
class ThemeFactory {
  createButton() {
    throw new Error("구현 필요");
  }
  createWindow() {
    throw new Error("구현 필요");
  }
}

// 2. Concrete Factory
class DarkThemeFactory extends ThemeFactory {
  createButton() {
    return new DarkButton();
  }
  createWindow() {
    return new DarkWindow();
  }
}

// 3. Concrete Factory
class LightThemeFactory extends ThemeFactory {
  createButton() {
    return new LightButton();
  }
  createWindow() {
    return new LightWindow();
  }
}

// 4. Products (다크 테마 제품군)
class DarkButton {
  render() {
    console.log("검은 버튼");
  }
}
class DarkWindow {
  render() {
    console.log("검은 창");
  }
}

// 5. Products (라이트 테마 제품군)
class LightButton {
  render() {
    console.log("하얀 버튼");
  }
}
class LightWindow {
  render() {
    console.log("하얀 창");
  }
}

// 사용: 클라이언트는 구체적인 클래스(new DarkButton)를 몰라도 됨
function renderApp(factory) {
  const btn = factory.createButton();
  const win = factory.createWindow();

  btn.render();
  win.render();
}

renderApp(new DarkThemeFactory()); // 검은 세트 렌더링
renderApp(new LightThemeFactory()); // 하얀 세트 렌더링
```

---

## 3. 정적 팩토리 메서드 -> 싱글톤 구현?

정적 팩토리 메서드(`static create()`)를 사용하면 **싱글톤(Singleton)** 패턴을 아주 자연스럽게 구현할 수 있다.

### 왜 Static인가?

객체를 생성하기 전 단계이므로, **인스턴스가 없어도 호출할 수 있어야 하기 때문**이다.

### 싱글톤/캐싱 구현 원리

생성자(`new`)는 무조건 새 객체를 뱉어내지만, 정적 메서드는 **내부 로직을 제어**할 수 있다.

1.  **싱글톤:** "이미 만들어둔 게 있으면 그거 리턴해" (`instance` 재사용)
2.  **플라이웨이트(Flyweight):** "이 키값(예: 'RED')으로 만든 적 있으면 그거 리턴해" (Map에 캐싱)

```javascript
class Database {
  static #instance; // 내부 저장소

  // 정적 팩토리 메서드
  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database(); // 없으면 만들고
    }
    return Database.#instance; // 있으면 재사용 (싱글톤)
  }
}
```
