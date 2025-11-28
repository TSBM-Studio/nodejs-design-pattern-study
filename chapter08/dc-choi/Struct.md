# 프록시 패턴
Subject라고 하는 다른 객체에 대한 엑세스를 제어하는 객체.

Subject에 대해 실행되는 작업의 전부 또는 일부를 가로채서 해당 동작을 증강하거나 보완합니다.

프록시는 다음과 같은 몇 가지 상황에서 유용함.
1. 데이터 검증: 클라이언트가 Subject에 접근하기 전에 입력 데이터를 검증하는 프록시를 구현할 수 있습니다.
2. 보안: 클라이언트가 작업을 수행할 권한이 있는지 확인하고, 권한이 있는 경우에만 요청을 Subject에 전달.
3. 캐싱: 데이터가 아직 캐시에 없는 경우에만 프록시가 Subject에 실행되도록 프록시는 내부에 캐시를 유지함.
4. 느린 초기화: Subject 생성하는데 많은 비용이 드는 경우, 프록시는 실제로 필요할 때까지 이를 지연시킬 수 있음.
5. 기록: 메서드 호출과 관련 매개 변수를 가로채서 발생시 이를 기록함.
6. 원격 프록시: 원격 개체를 가져와서 로컬로 표시할 수 있음.

## 구현 기술
프록시 패턴을 구현하는 방법에는 여러 가지가 있음.

### 객체 컴포지션
기능을 확장해서 사용하기 위해 Subject를 프록시 객체와 결합하는 것.

### 객체 확장
Subject를 상속받아 프록시 객체에서 기능을 확장하는 것. 단, 이 방법은 대상 객체를 직접 변경하기 때문에 위험할 수 있음.

### 내장 프록시 객체
ES2015에서 도입된 Proxy 객체를 사용합니다.

이 객체는 생성자가 대상과 핸들러를 인자로 받아들임.

```js
const calculator = new StackCalculator();

const safeCalculator = new Proxy(calculator, {
      get(target, key) {
          if (typeof key === 'divide') {
              return function () {
                  const divisor = target.peekValue();
                  if (divisor === 0) {
                      throw new Error('0으로 나눌 수 없습니다.');
                  }
                  return target.divide();
              };
          }
          
          return target[key];
      }
});
```

# 데코레이터 패턴
