/**
 * 02-state-failover-socket.js
 * 상태 패턴 - 장애 조치 소켓
 *
 * 상태 패턴을 사용하여 연결 상태에 따라 다르게 동작하는
 * 장애 조치(failover) 소켓을 구현합니다.
 */

import { EventEmitter } from 'events'

// ============================================
// 상태(State) 정의
// ============================================

/**
 * 오프라인 상태
 * - send(): 메시지를 큐에 저장
 * - activate(): 온라인 상태로 전환
 */
const OfflineState = {
  name: 'OFFLINE',

  send(context, data) {
    console.log(`[OFFLINE] 메시지 큐잉: "${data}"`)
    context.queue.push(data)
  },

  activate(context) {
    console.log('[OFFLINE → ONLINE] 연결됨')
    context.state = OnlineState

    // 큐에 쌓인 메시지 전송
    if (context.queue.length > 0) {
      console.log(`[ONLINE] 큐에 쌓인 ${context.queue.length}개 메시지 전송 중...`)
      for (const data of context.queue) {
        context.socket.write(data)
        console.log(`  → 전송: "${data}"`)
      }
      context.queue = []
    }

    context.emit('connected')
  },

  deactivate(context) {
    console.log('[OFFLINE] 이미 오프라인 상태')
  }
}

/**
 * 온라인 상태
 * - send(): 메시지를 바로 전송
 * - deactivate(): 오프라인 상태로 전환
 */
const OnlineState = {
  name: 'ONLINE',

  send(context, data) {
    console.log(`[ONLINE] 메시지 전송: "${data}"`)
    context.socket.write(data)
  },

  activate(context) {
    console.log('[ONLINE] 이미 온라인 상태')
  },

  deactivate(context) {
    console.log('[ONLINE → OFFLINE] 연결 끊김')
    context.state = OfflineState
    context.emit('disconnected')
  }
}

// ============================================
// 컨텍스트(Context) - FailoverSocket 클래스
// ============================================

class FailoverSocket extends EventEmitter {
  constructor() {
    super()
    this.state = OfflineState
    this.queue = []
    this.socket = null
  }

  /**
   * 메시지 전송 (현재 상태에 위임)
   */
  send(data) {
    this.state.send(this, data)
  }

  /**
   * 연결 활성화 (현재 상태에 위임)
   */
  activate() {
    this.state.activate(this)
  }

  /**
   * 연결 비활성화 (현재 상태에 위임)
   */
  deactivate() {
    this.state.deactivate(this)
  }

  /**
   * 현재 상태 이름
   */
  getStateName() {
    return this.state.name
  }
}

// ============================================
// 모의(Mock) 소켓 구현
// ============================================

class MockSocket {
  constructor() {
    this.messages = []
  }

  write(data) {
    this.messages.push(data)
  }

  getMessages() {
    return this.messages
  }
}

// ============================================
// 테스트
// ============================================

function main() {
  console.log('=== 상태 패턴: 장애 조치 소켓 ===\n')

  const failoverSocket = new FailoverSocket()
  const mockSocket = new MockSocket()
  failoverSocket.socket = mockSocket

  // 이벤트 리스너 등록
  failoverSocket.on('connected', () => {
    console.log('이벤트: connected 발생')
  })
  failoverSocket.on('disconnected', () => {
    console.log('이벤트: disconnected 발생')
  })

  // 1. 오프라인 상태에서 메시지 전송 (큐잉됨)
  console.log('--- 오프라인 상태에서 메시지 전송 ---')
  console.log(`현재 상태: ${failoverSocket.getStateName()}`)
  failoverSocket.send('메시지 1')
  failoverSocket.send('메시지 2')
  failoverSocket.send('메시지 3')
  console.log(`큐 상태: [${failoverSocket.queue.join(', ')}]`)
  console.log()

  // 2. 연결 활성화 (큐 플러시)
  console.log('--- 연결 활성화 ---')
  failoverSocket.activate()
  console.log(`현재 상태: ${failoverSocket.getStateName()}`)
  console.log(`큐 상태: [${failoverSocket.queue.join(', ')}]`)
  console.log()

  // 3. 온라인 상태에서 메시지 전송 (바로 전송)
  console.log('--- 온라인 상태에서 메시지 전송 ---')
  failoverSocket.send('메시지 4')
  failoverSocket.send('메시지 5')
  console.log()

  // 4. 연결 끊김
  console.log('--- 연결 비활성화 ---')
  failoverSocket.deactivate()
  console.log(`현재 상태: ${failoverSocket.getStateName()}`)
  console.log()

  // 5. 다시 오프라인에서 메시지 전송
  console.log('--- 다시 오프라인에서 메시지 전송 ---')
  failoverSocket.send('메시지 6')
  failoverSocket.send('메시지 7')
  console.log(`큐 상태: [${failoverSocket.queue.join(', ')}]`)
  console.log()

  // 6. 다시 연결
  console.log('--- 다시 연결 ---')
  failoverSocket.activate()
  console.log()

  // 최종 결과
  console.log('--- 최종 결과 ---')
  console.log('전송된 모든 메시지:', mockSocket.getMessages())

  console.log('\n=== 상태 패턴 테스트 완료 ===')
}

main()
