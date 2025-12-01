/**
 * 연습문제 9.3: 창고 아이템 상태 관리
 *
 * 상태 패턴을 사용하여 창고 아이템의 상태를 관리합니다.
 *
 * 상태:
 * - Arriving: 도착 예정 (입고 대기)
 * - Stored: 입고됨 (창고에 보관 중)
 * - Delivered: 배송됨 (출고 완료)
 *
 * 전환:
 * - Arriving → store() → Stored
 * - Stored → deliver() → Delivered
 * - Stored → describe() → 현재 위치 반환
 */

// ============================================
// 상태(State) 정의
// ============================================

/**
 * 도착 예정 상태 (Arriving)
 */
const ArrivingState = {
  name: 'ARRIVING',

  store(item, location) {
    console.log(`[ARRIVING → STORED] 아이템 "${item.name}" 입고: ${location}`)
    item.location = location
    item.state = StoredState
    return true
  },

  deliver(item, address) {
    console.log(`[ARRIVING] 에러: 아직 입고되지 않은 아이템은 배송할 수 없습니다.`)
    return false
  },

  describe(item) {
    return `아이템 "${item.name}": 도착 예정 (${item.expectedDate})`
  }
}

/**
 * 입고됨 상태 (Stored)
 */
const StoredState = {
  name: 'STORED',

  store(item, location) {
    console.log(`[STORED] 아이템 "${item.name}" 위치 변경: ${item.location} → ${location}`)
    item.location = location
    return true
  },

  deliver(item, address) {
    console.log(`[STORED → DELIVERED] 아이템 "${item.name}" 배송: ${address}`)
    item.deliveryAddress = address
    item.deliveryDate = new Date().toISOString()
    item.state = DeliveredState
    return true
  },

  describe(item) {
    return `아이템 "${item.name}": 창고 보관 중 (위치: ${item.location})`
  }
}

/**
 * 배송됨 상태 (Delivered)
 */
const DeliveredState = {
  name: 'DELIVERED',

  store(item, location) {
    console.log(`[DELIVERED] 에러: 이미 배송된 아이템은 다시 입고할 수 없습니다.`)
    return false
  },

  deliver(item, address) {
    console.log(`[DELIVERED] 에러: 이미 배송 완료된 아이템입니다.`)
    return false
  },

  describe(item) {
    return `아이템 "${item.name}": 배송 완료 (주소: ${item.deliveryAddress}, 날짜: ${item.deliveryDate})`
  }
}

// ============================================
// 컨텍스트(Context) - WarehouseItem 클래스
// ============================================

class WarehouseItem {
  constructor(name, expectedDate) {
    this.name = name
    this.expectedDate = expectedDate
    this.state = ArrivingState
    this.location = null
    this.deliveryAddress = null
    this.deliveryDate = null
  }

  /**
   * 아이템 입고 (현재 상태에 위임)
   */
  store(location) {
    return this.state.store(this, location)
  }

  /**
   * 아이템 배송 (현재 상태에 위임)
   */
  deliver(address) {
    return this.state.deliver(this, address)
  }

  /**
   * 아이템 설명 (현재 상태에 위임)
   */
  describe() {
    return this.state.describe(this)
  }

  /**
   * 현재 상태 이름
   */
  getStateName() {
    return this.state.name
  }

  /**
   * 아이템 정보 출력
   */
  toString() {
    return JSON.stringify({
      name: this.name,
      state: this.getStateName(),
      location: this.location,
      deliveryAddress: this.deliveryAddress
    }, null, 2)
  }
}

// ============================================
// 테스트
// ============================================

function main() {
  console.log('=== 연습문제 9.3: 창고 아이템 상태 관리 ===\n')

  // 1. 아이템 생성 (ARRIVING 상태)
  console.log('--- 1. 아이템 생성 ---')
  const laptop = new WarehouseItem('노트북 Pro', '2024-12-15')
  console.log(`상태: ${laptop.getStateName()}`)
  console.log(`설명: ${laptop.describe()}`)
  console.log()

  // 2. 잘못된 동작 시도: ARRIVING 상태에서 배송
  console.log('--- 2. ARRIVING 상태에서 배송 시도 ---')
  const result1 = laptop.deliver('서울시 강남구')
  console.log(`결과: ${result1 ? '성공' : '실패'}`)
  console.log()

  // 3. 입고 (ARRIVING → STORED)
  console.log('--- 3. 아이템 입고 ---')
  laptop.store('A-12-3')
  console.log(`상태: ${laptop.getStateName()}`)
  console.log(`설명: ${laptop.describe()}`)
  console.log()

  // 4. 위치 변경 (STORED 상태에서)
  console.log('--- 4. 보관 위치 변경 ---')
  laptop.store('B-05-7')
  console.log(`설명: ${laptop.describe()}`)
  console.log()

  // 5. 배송 (STORED → DELIVERED)
  console.log('--- 5. 아이템 배송 ---')
  laptop.deliver('서울시 강남구 테헤란로 123')
  console.log(`상태: ${laptop.getStateName()}`)
  console.log(`설명: ${laptop.describe()}`)
  console.log()

  // 6. 잘못된 동작 시도: DELIVERED 상태에서 다시 입고
  console.log('--- 6. DELIVERED 상태에서 입고 시도 ---')
  const result2 = laptop.store('C-01-1')
  console.log(`결과: ${result2 ? '성공' : '실패'}`)
  console.log()

  // 7. 잘못된 동작 시도: DELIVERED 상태에서 다시 배송
  console.log('--- 7. DELIVERED 상태에서 배송 시도 ---')
  const result3 = laptop.deliver('부산시 해운대구')
  console.log(`결과: ${result3 ? '성공' : '실패'}`)
  console.log()

  // 8. 여러 아이템 관리
  console.log('--- 8. 여러 아이템 관리 ---')
  const items = [
    new WarehouseItem('모니터', '2024-12-16'),
    new WarehouseItem('키보드', '2024-12-17'),
    new WarehouseItem('마우스', '2024-12-18')
  ]

  // 첫 번째 아이템: 입고만
  items[0].store('A-01-1')

  // 두 번째 아이템: 입고 후 배송
  items[1].store('A-02-1')
  items[1].deliver('인천시 남동구')

  // 세 번째 아이템: 도착 대기 유지

  console.log('모든 아이템 상태:')
  for (const item of items) {
    console.log(`  - ${item.describe()}`)
  }

  // 9. 최종 상태 출력
  console.log('\n--- 9. 노트북 최종 정보 ---')
  console.log(laptop.toString())

  console.log('\n=== 연습문제 9.3 완료 ===')
}

main()
