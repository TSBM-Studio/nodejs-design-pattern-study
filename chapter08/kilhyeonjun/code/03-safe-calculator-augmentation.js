/**
 * Chapter 8: 구조적 설계 패턴
 * 03-safe-calculator-augmentation.js - 객체 확장(몽키 패치)을 사용한 프록시
 *
 * 객체 확장(Object Augmentation) 기술로 프록시 패턴 구현
 * Subject를 직접 수정하여 함수를 프록시 구현으로 대체합니다.
 *
 * ⚠️ 주의: Subject가 다른 코드와 공유되는 경우 피해야 합니다!
 * 원래 동작이 변경되어 예기치 않은 부작용이 발생할 수 있습니다.
 */

import { StackCalculator } from './01-stack-calculator.js'

function patchToSafeCalculator(calculator) {
  // 원본 함수 저장
  const divideOrig = calculator.divide

  // 프록시 함수로 교체
  calculator.divide = () => {
    // 추가적인 검증 로직
    const divisor = calculator.peekValue()
    if (divisor === 0) {
      throw Error('Division by 0')
    }
    // Subject에 유효한 위임자일 경우 원본 함수 호출
    return divideOrig.apply(calculator)
  }

  return calculator
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const calculator = new StackCalculator()
  const safeCalculator = patchToSafeCalculator(calculator)

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
    console.log('15 / 0 =', err.message)  // "Division by 0"
  }

  // ⚠️ 몽키 패치의 위험성 데모
  // calculator와 safeCalculator는 동일한 객체를 참조합니다!
  console.log('\n=== 몽키 패치의 위험성 ===')
  console.log('calculator === safeCalculator:', calculator === safeCalculator)

  // 원본 calculator도 변경되었습니다
  calculator.clear()
  calculator.putValue(100)
  calculator.putValue(0)
  try {
    console.log('원본 calculator로 100 / 0:', calculator.divide())
  } catch (err) {
    console.log('원본 calculator도 변경됨:', err.message)
    // 원본 인스턴스도 에러를 발생시킵니다!
  }
}

export { patchToSafeCalculator }
