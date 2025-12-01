/**
 * Chapter 8: 구조적 설계 패턴
 * 07-enhanced-calculator-decorator.js - 데코레이터 패턴
 *
 * 데코레이터 패턴은 기존 객체에 새로운 기능을 동적으로 추가합니다.
 * 프록시와 달리 인터페이스를 확장합니다.
 */

import { StackCalculator } from './01-stack-calculator.js'

// 방법 1: 클래스를 사용한 컴포지션 데코레이터
class EnhancedCalculator {
  constructor(calculator) {
    this.calculator = calculator
  }

  // 새로운 함수 - 덧셈 기능 추가
  add() {
    const addend2 = this.getValue()
    const addend1 = this.getValue()
    const result = addend1 + addend2
    this.putValue(result)
    return result
  }

  // 새로운 함수 - 뺄셈 기능 추가
  subtract() {
    const subtrahend = this.getValue()
    const minuend = this.getValue()
    const result = minuend - subtrahend
    this.putValue(result)
    return result
  }

  // 수정된 함수 - 0으로 나누기 방지
  divide() {
    const divisor = this.calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return this.calculator.divide()
  }

  // 위임된 함수들
  putValue(value) { return this.calculator.putValue(value) }
  getValue() { return this.calculator.getValue() }
  peekValue() { return this.calculator.peekValue() }
  clear() { return this.calculator.clear() }
  multiply() { return this.calculator.multiply() }
}

// 방법 2: 객체 확장(몽키 패치) 데코레이터
function patchCalculator(calculator) {
  // 새로운 함수 추가
  calculator.add = function () {
    const addend2 = calculator.getValue()
    const addend1 = calculator.getValue()
    const result = addend1 + addend2
    calculator.putValue(result)
    return result
  }

  calculator.subtract = function () {
    const subtrahend = calculator.getValue()
    const minuend = calculator.getValue()
    const result = minuend - subtrahend
    calculator.putValue(result)
    return result
  }

  // 기존 함수 수정
  const divideOrig = calculator.divide
  calculator.divide = () => {
    const divisor = calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    return divideOrig.apply(calculator)
  }

  return calculator
}

// 방법 3: Proxy 객체를 이용한 데코레이터
const enhancedCalculatorHandler = {
  get(target, property) {
    if (property === 'add') {
      // 새로운 함수
      return function add() {
        const addend2 = target.getValue()
        const addend1 = target.getValue()
        const result = addend1 + addend2
        target.putValue(result)
        return result
      }
    } else if (property === 'subtract') {
      // 새로운 함수
      return function subtract() {
        const subtrahend = target.getValue()
        const minuend = target.getValue()
        const result = minuend - subtrahend
        target.putValue(result)
        return result
      }
    } else if (property === 'divide') {
      // 수정된 함수
      return function () {
        const divisor = target.peekValue()
        if (divisor === 0) {
          throw Error('Division by 0')
        }
        return target.divide()
      }
    }
    // 위임된 함수들과 속성들
    return target[property]
  }
}

function createEnhancedCalculatorProxy(calculator) {
  return new Proxy(calculator, enhancedCalculatorHandler)
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 클래스 기반 데코레이터 테스트 ===')
  const calculator1 = new StackCalculator()
  const enhanced1 = new EnhancedCalculator(calculator1)

  enhanced1.putValue(4)
  enhanced1.putValue(3)
  console.log('4 + 3 =', enhanced1.add())  // 7

  enhanced1.putValue(2)
  console.log('7 * 2 =', enhanced1.multiply())  // 14

  enhanced1.putValue(4)
  console.log('14 - 4 =', enhanced1.subtract())  // 10

  console.log('\n=== 객체 확장 데코레이터 테스트 ===')
  const calculator2 = new StackCalculator()
  const enhanced2 = patchCalculator(calculator2)

  enhanced2.putValue(10)
  enhanced2.putValue(5)
  console.log('10 + 5 =', enhanced2.add())  // 15

  enhanced2.putValue(3)
  console.log('15 - 3 =', enhanced2.subtract())  // 12

  console.log('\n=== Proxy 객체 데코레이터 테스트 ===')
  const calculator3 = new StackCalculator()
  const enhanced3 = createEnhancedCalculatorProxy(calculator3)

  enhanced3.putValue(20)
  enhanced3.putValue(10)
  console.log('20 + 10 =', enhanced3.add())  // 30

  enhanced3.putValue(5)
  console.log('30 / 5 =', enhanced3.divide())  // 6

  // 0으로 나누기 테스트
  enhanced3.putValue(0)
  try {
    enhanced3.divide()
  } catch (err) {
    console.log('6 / 0 =', err.message)  // "Division by 0"
  }
}

export { EnhancedCalculator, patchCalculator, createEnhancedCalculatorProxy }
