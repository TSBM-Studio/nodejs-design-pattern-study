/**
 * Chapter 8: 구조적 설계 패턴
 * 01-stack-calculator.js - 기본 StackCalculator 클래스
 *
 * 스택 기반 계산기 구현
 * 모든 피연산자를 스택에 유지하고, 연산 시 스택에서 값을 추출하여 계산합니다.
 */

export class StackCalculator {
  constructor() {
    this.stack = []
  }

  // 스택에 값 추가
  putValue(value) {
    this.stack.push(value)
  }

  // 스택에서 값 추출 (제거)
  getValue() {
    return this.stack.pop()
  }

  // 스택의 맨 위 값 확인 (제거하지 않음)
  peekValue() {
    return this.stack[this.stack.length - 1]
  }

  // 스택 초기화
  clear() {
    this.stack = []
  }

  // 나눗셈: dividend / divisor
  // JavaScript에서 0으로 나누면 Infinity 반환
  divide() {
    const divisor = this.getValue()
    const dividend = this.getValue()
    const result = dividend / divisor
    this.putValue(result)
    return result
  }

  // 곱셈: multiplier * multiplicand
  multiply() {
    const multiplicand = this.getValue()
    const multiplier = this.getValue()
    const result = multiplier * multiplicand
    this.putValue(result)
    return result
  }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const calculator = new StackCalculator()

  // 기본 연산 테스트
  calculator.putValue(3)
  calculator.putValue(2)
  console.log('3 * 2 =', calculator.multiply())  // 6

  calculator.putValue(2)
  console.log('6 * 2 =', calculator.multiply())  // 12

  // 0으로 나누기 테스트 (Infinity 반환)
  calculator.clear()
  calculator.putValue(10)
  calculator.putValue(0)
  console.log('10 / 0 =', calculator.divide())   // Infinity
}
