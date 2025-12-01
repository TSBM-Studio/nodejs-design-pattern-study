/**
 * Chapter 8: 구조적 설계 패턴
 * 04-safe-calculator-proxy.js - ES2015 Proxy 객체를 사용한 프록시
 *
 * ES2015 Proxy 객체를 사용한 프록시 패턴 구현
 * 가장 현대적이고 강력한 방법으로, Subject를 변경하지 않으면서
 * 동적으로 속성과 함수 접근을 가로챌 수 있습니다.
 */

import { StackCalculator } from './01-stack-calculator.js'

// Proxy 핸들러 정의
const safeCalculatorHandler = {
  get: (target, property) => {
    if (property === 'divide') {
      // 프록시된 함수
      return function () {
        // 추가적인 검증 로직
        const divisor = target.peekValue()
        if (divisor === 0) {
          throw Error('Division by 0')
        }
        // Subject에 대한 유효한 위임자일 경우
        return target.divide()
      }
    }
    // 위임된 함수들과 속성들
    return target[property]
  }
}

// 프록시 생성 팩토리
function createSafeCalculatorProxy(calculator) {
  return new Proxy(calculator, safeCalculatorHandler)
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const calculator = new StackCalculator()
  const safeCalculator = new Proxy(calculator, safeCalculatorHandler)

  // 기본 연산 테스트
  safeCalculator.putValue(10)
  safeCalculator.putValue(2)
  console.log('10 / 2 =', safeCalculator.divide())  // 5

  safeCalculator.putValue(3)
  console.log('5 * 3 =', safeCalculator.multiply())  // 15

  // 0으로 나누기 테스트 - 에러 발생
  safeCalculator.putValue(0)
  try {
    console.log(safeCalculator.divide())
  } catch (err) {
    console.log('15 / 0 (프록시) =', err.message)  // "Division by 0"
  }

  // Proxy의 장점: Subject가 변경되지 않음
  console.log('\n=== Proxy의 안전성 ===')
  console.log('calculator === safeCalculator:', calculator === safeCalculator)  // false

  // 원본 calculator는 여전히 Infinity 반환
  calculator.clear()
  calculator.putValue(100)
  calculator.putValue(0)
  console.log('원본 calculator로 100 / 0:', calculator.divide())  // Infinity

  // instanceof 테스트 - Proxy는 Subject의 프로토타입을 상속
  console.log('\n=== instanceof 테스트 ===')
  console.log('safeCalculator instanceof StackCalculator:', safeCalculator instanceof StackCalculator)  // true

  // 가상 배열 예제: 모든 짝수를 포함하는 배열
  console.log('\n=== 가상 배열 예제 (Proxy의 고급 기능) ===')
  const evenNumbers = new Proxy([], {
    get: (target, index) => index * 2,
    has: (target, number) => number % 2 === 0
  })

  console.log('2 in evenNumbers:', 2 in evenNumbers)     // true
  console.log('5 in evenNumbers:', 5 in evenNumbers)     // false
  console.log('evenNumbers[7]:', evenNumbers[7])         // 14
  console.log('evenNumbers[100]:', evenNumbers[100])     // 200
}

export { safeCalculatorHandler, createSafeCalculatorProxy }
