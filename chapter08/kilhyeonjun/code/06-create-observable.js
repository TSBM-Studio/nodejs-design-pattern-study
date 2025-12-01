/**
 * Chapter 8: 구조적 설계 패턴
 * 06-create-observable.js - 변경 옵저버 패턴 (Change Observer Pattern)
 *
 * 객체의 속성 변경을 감지하고 옵저버에게 알리는 패턴입니다.
 * 반응형 프로그래밍(Reactive Programming)의 초석이 됩니다.
 */

/**
 * 관찰 가능한 객체를 생성하는 팩토리
 * @param {Object} target - 관찰할 대상 객체
 * @param {Function} observer - 변경 시 호출될 콜백 함수
 * @returns {Proxy} 관찰 가능한 프록시 객체
 */
export function createObservable(target, observer) {
  const observable = new Proxy(target, {
    set(obj, prop, value) {
      // 값이 변경된 경우에만 알림
      if (value !== obj[prop]) {
        const prev = obj[prop]
        obj[prop] = value
        // 관찰자에게 변경 정보 전달
        observer({ prop, prev, curr: value })
      }
      return true
    }
  })
  return observable
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 변경 옵저버 패턴 테스트 ===\n')

  // 송장 합계 자동 계산 예제
  function calculateTotal(invoice) {
    return invoice.subtotal - invoice.discount + invoice.tax
  }

  const invoice = {
    subtotal: 100,
    discount: 10,
    tax: 20
  }

  let total = calculateTotal(invoice)
  console.log(`Starting total: ${total}`)

  // 관찰 가능한 송장 객체 생성
  const obsInvoice = createObservable(
    invoice,
    ({ prop, prev, curr }) => {
      total = calculateTotal(invoice)
      console.log(`TOTAL: ${total} (${prop} changed: ${prev} -> ${curr})`)
    }
  )

  console.log('\n--- 속성 변경 ---')
  obsInvoice.subtotal = 200  // TOTAL: 210 (subtotal changed: 100 -> 200)
  obsInvoice.discount = 20   // TOTAL: 200 (discount changed: 10 -> 20)
  obsInvoice.discount = 20   // 변경 없음 - 알림 없음
  obsInvoice.tax = 30        // TOTAL: 210 (tax changed: 20 -> 30)

  console.log(`\nFinal total: ${total}`)

  // 새로운 필드 추가도 감지
  console.log('\n--- 새 필드 추가 ---')
  const productObserver = ({ prop, prev, curr }) => {
    console.log(`Product changed: ${prop} = ${prev} -> ${curr}`)
  }

  const product = { name: 'Widget', price: 100 }
  const obsProduct = createObservable(product, productObserver)

  obsProduct.name = 'Super Widget'   // name 변경 감지
  obsProduct.price = 150             // price 변경 감지
  obsProduct.stock = 50              // 새 필드 추가 감지 (prev = undefined)
}
