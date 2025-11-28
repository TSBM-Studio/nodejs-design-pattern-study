# 왜 TS에서는 객체지향보다 함수형이 더 자연스러운가?
TS 타입 시스템 + JS 런타임 특성상 클래스 기반의 OOP보다 값 + 함수 기반의 FP가 더 자연스럽고 강력함.

## 언어 자체가 애초에 "클래스 언어"가 아님.
JS의 클래스는 프로토타입 기반 OOP 위에 올린 문법 설탕.

TypeScript의 타입 시스템은 명시적 타이핑이 아니라 구조적 타이핑임.

즉, 타입이 클래스에 묶여 있지 않고 값에 묶여 있음.

## 데이터 모델링: class vs type union & intersection
클래스 기반 OOP에서는 상속을 통해 데이터 모델링을 함.

하지만 TS에서는 상속보다는 타입 별칭(type alias)을 통한 유니언 타입과 인터섹션 타입이 더 자연스러움.

```ts
abstract class Payment {
    abstract total(): number;
}

class CardPayment extends Payment {
    constructor(public amount: number, public fee: number) { super(); }
    total() { return this.amount + this.fee; }
}

class CashPayment extends Payment {
    constructor(public amount: number) { super(); }
    total() { return this.amount; }
}
```

여기서는 런타임에서 instanceof 체크를 통해 타입을 구분해야 함.

```ts
type CardPayment = {
    type: 'card';
    amount: number;
    fee: number;
};

type CashPayment = {
    type: 'cash';
    amount: number;
};

type Payment = CardPayment | CashPayment;

const total = (p: Payment): number => {
    switch (p.type) {
        case 'card':
            return p.amount + p.fee;
        case 'cash':
            return p.amount;
        default: {
            // never 체크해서 새 유형 추가 누락 방지 가능
            const _exhaustive: never = p;
            return _exhaustive;
        }
    }
};
```

이 경우, 타입 시스템이 런타임 체크 없이도 모든 케이스를 다루도록 강제할 수 있음.

## 제네릭 + 고차 함수 조합
TS에서는 제네릭과 고차 함수를 조합하여 재사용 가능한 컴포넌트를 쉽게 만들 수 있음.

```ts
const map = <T, R>(arr: T[], fn: (item: T) => R): R[] => {
    const result: R[] = [];
    for (const item of arr) {
        result.push(fn(item));
    }
    return result;
};
```

## 그럼 TS에서 OOP 패턴이 무의미한가?
1. NestJS처럼 클래스 + 데코레이터 조합이 자연스러운 프레임워크에서는 여전히 유용함.
2. 수명주기나 상태 관리가 중요한 컴포넌트에서는 OOP 패턴이 도움이 될 수 있음.

## 결론
바깥 레이어는 OOP 패턴을 사용하더라도, 안쪽 도메인 로직/유틸리티 로직 등은 함수형 스타일로 작성하는 것이 TS의 장점을 최대한 활용하는 방법임.
