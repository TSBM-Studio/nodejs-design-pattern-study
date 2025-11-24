# Builder Pattern 조금 다른 각도로 알아보기

TS 에서 빌더 패턴을 직접 구현하게 될 때, 한 가지 거슬리는 것이 있었는데요.

![](https://github.com/user-attachments/assets/40ea86da-f9cf-420b-adc0-a4aae9e2b720)

이미지와 같이 이미 체이닝된 메서드가 계속 나오는 것이 거슬렸습니다. 그래서, 이미 체이닝된 메서드를 메서드 리스트에서 제외시킬 수 있는 방법을 고민해봤습니다.

---

## this에 Omit 타입을 assertion 해서 체이닝된 메서드를 제외시키기

TypeScript의 `Omit` Utility Type을 활용하면, `this`에 `Omit` 타입을 assertion 해서 체이닝된 메서드를 제외시킬 수 있습니다.

각 빌더 메서드에서는 this를 리턴하는데, 이 때 `Omit` 타입을 assertion 해서 체이닝된 메서드를 제외시킬 수 있습니다.

### Implementation Code

```typescript
class UserAttributesOmitBuilder {
  private constructor() {}
  private user: Partial<UserAttributes> = {};

  static getBuilder(): Omit<UserAttributesOmitBuilder, "constructor"> {
    const instance = new UserAttributesOmitBuilder();
    return instance as Omit<UserAttributesOmitBuilder, "constructor">;
  }

  setName(name: string): Omit<this, "setName"> {
    this.user.name = name;
    return this as Omit<this, "setName">;
  }

  setAge(age: number): Omit<this, "setAge"> {
    this.user.age = age;
    return this as Omit<this, "setAge">;
  }

  setEmail(email: string): Omit<this, "setEmail"> {
    this.user.email = email;
    return this as Omit<this, "setEmail">;
  }

  setPassword(password: string): Omit<this, "setPassword"> {
    this.user.password = password;
    return this as Omit<this, "setPassword">;
  }

  build(): UserAttributes {
    return this.user as UserAttributes;
  }
}
```

![](https://github.com/user-attachments/assets/f7b5ecd3-13c0-4214-82c8-15edb871f343)

위 이미지와 같이 이미 체이닝된 메서드를 제외시킬 수 있습니다.

그 외에 `Pick` Utility Type을 활용하면, 체이닝될 메서드의 순서를 강제할 수도 있습니다. 또, 이런저런 타입 마개조를 하면 `optional` 속성을 처리하는 등의 다양한 기능을 구현할 수 있습니다.

딥다이브라고 하기에는 너무 간단한 내용이지만, 빌더 패턴을 직접 구현할 때 참고하면 좋을 것 같아서 공유합니다.
