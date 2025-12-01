/**
 * Chapter 8: 구조적 설계 패턴
 * 02-safe-calculator-composition.js - 컴포지션을 사용한 프록시
 *
 * 객체 컴포지션 기술로 프록시 패턴 구현
 * Subject와 동일한 인터페이스를 가진 새로운 객체를 생성하고,
 * Subject에 대한 참조를 내부에 저장합니다.
 */

import { StackCalculator } from './01-stack-calculator.js'

// 방법 1: 클래스를 사용한 컴포지션
class SafeCalculator {
  constructor(calculator) {
    this.calculator = calculator
  }

  // 프록시된 함수 - 0으로 나누기 방지
  divide() {
    const divisor = this.calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return this.calculator.divide()
  }

  // 위임된 함수들 - Subject에 그대로 전달
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

// 방법 2: 팩토리 함수와 객체 리터럴을 사용한 컴포지션
function createSafeCalculator(calculator) {
  return {
    // 프록시된 함수
    divide() {
      const divisor = calculator.peekValue()
      if (divisor === 0) {
        throw Error('Division by 0')
      }
      return calculator.divide()
    },
    // 위임된 함수들
    putValue(value) {
      return calculator.putValue(value)
    },
    getValue() {
      return calculator.getValue()
    },
    peekValue() {
      return calculator.peekValue()
    },
    clear() {
      return calculator.clear()
    },
    multiply() {
      return calculator.multiply()
    }
  }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 클래스 기반 컴포지션 테스트 ===')
  const calculator1 = new StackCalculator()
  const safeCalculator1 = new SafeCalculator(calculator1)

  calculator1.putValue(3)
  calculator1.putValue(2)
  console.log('3 * 2 =', calculator1.multiply())  // 6

  safeCalculator1.putValue(2)
  console.log('6 * 2 =', safeCalculator1.multiply())  // 12

  // 원본 calculator로 0으로 나누기 - Infinity 반환
  calculator1.putValue(0)
  console.log('12 / 0 (원본) =', calculator1.divide())  // Infinity

  // SafeCalculator로 0으로 나누기 - 에러 발생
  safeCalculator1.clear()
  safeCalculator1.putValue(4)
  safeCalculator1.putValue(0)
  try {
    console.log(safeCalculator1.divide())
  } catch (err) {
    console.log('4 / 0 (프록시) =', err.message)  // "Division by 0"
  }

  console.log('\n=== 팩토리 함수 기반 컴포지션 테스트 ===')
  const calculator2 = new StackCalculator()
  const safeCalculator2 = createSafeCalculator(calculator2)

  safeCalculator2.putValue(10)
  safeCalculator2.putValue(2)
  console.log('10 / 2 =', safeCalculator2.divide())  // 5

  safeCalculator2.putValue(0)
  try {
    console.log(safeCalculator2.divide())
  } catch (err) {
    console.log('5 / 0 (팩토리) =', err.message)  // "Division by 0"
  }
}

export { SafeCalculator, createSafeCalculator }
