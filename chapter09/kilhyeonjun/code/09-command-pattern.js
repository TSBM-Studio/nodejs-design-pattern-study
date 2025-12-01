/**
 * 09-command-pattern.js
 * 명령(Command) 패턴
 *
 * 실행할 작업을 객체로 캡슐화하여 실행 취소(undo),
 * 지연 실행, 직렬화 등의 기능을 구현합니다.
 */

// ============================================
// 대상(Target) - 실제 작업을 수행하는 서비스
// ============================================

class StatusUpdateService {
  constructor() {
    this.timeline = []
  }

  postUpdate(status) {
    this.timeline.push({ text: status, timestamp: Date.now() })
    console.log(`[SERVICE] 상태 게시: "${status}"`)
    return this.timeline.length - 1  // ID 반환
  }

  destroyUpdate(id) {
    if (this.timeline[id]) {
      console.log(`[SERVICE] 상태 삭제: "${this.timeline[id].text}"`)
      this.timeline[id] = null
      return true
    }
    return false
  }

  getTimeline() {
    return this.timeline.filter(item => item !== null)
  }
}

// ============================================
// 명령(Command) 생성 함수
// ============================================

/**
 * 상태 게시 명령 생성
 * 클로저를 활용하여 상태를 유지
 */
function createPostStatusCmd(service, status) {
  let postId = null

  return {
    // 실행
    run() {
      postId = service.postUpdate(status)
      return postId
    },

    // 실행 취소
    undo() {
      if (postId !== null) {
        service.destroyUpdate(postId)
        postId = null
      }
    },

    // 직렬화 (JSON으로 저장 가능)
    serialize() {
      return JSON.stringify({ type: 'postStatus', status })
    }
  }
}

// ============================================
// 호출자(Invoker) - 명령 실행 관리
// ============================================

class CommandInvoker {
  constructor() {
    this.history = []
  }

  /**
   * 명령 즉시 실행
   */
  run(cmd) {
    console.log('\n[INVOKER] 명령 실행')
    cmd.run()
    this.history.push(cmd)
  }

  /**
   * 마지막 명령 취소
   */
  undo() {
    const cmd = this.history.pop()
    if (cmd) {
      console.log('\n[INVOKER] 명령 취소')
      cmd.undo()
    } else {
      console.log('\n[INVOKER] 취소할 명령 없음')
    }
  }

  /**
   * 지연 실행
   */
  delay(cmd, delayMs) {
    console.log(`\n[INVOKER] ${delayMs}ms 후 실행 예약`)
    setTimeout(() => {
      this.run(cmd)
    }, delayMs)
  }

  /**
   * 명령 직렬화 (원격 실행용)
   */
  serialize(cmd) {
    console.log('\n[INVOKER] 명령 직렬화')
    const serialized = cmd.serialize()
    console.log(`  결과: ${serialized}`)
    return serialized
  }

  /**
   * 직렬화된 명령 복원 및 실행
   */
  runSerialized(serialized, service) {
    console.log('\n[INVOKER] 직렬화된 명령 복원 및 실행')
    const data = JSON.parse(serialized)

    if (data.type === 'postStatus') {
      const cmd = createPostStatusCmd(service, data.status)
      this.run(cmd)
    }
  }
}

// ============================================
// 복합 명령 (Composite Command)
// ============================================

class CompositeCommand {
  constructor(commands = []) {
    this.commands = commands
  }

  add(cmd) {
    this.commands.push(cmd)
  }

  run() {
    for (const cmd of this.commands) {
      cmd.run()
    }
  }

  undo() {
    // 역순으로 취소
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo()
    }
  }

  serialize() {
    return JSON.stringify({
      type: 'composite',
      commands: this.commands.map(cmd => JSON.parse(cmd.serialize()))
    })
  }
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== 명령 패턴 ===\n')

  const service = new StatusUpdateService()
  const invoker = new CommandInvoker()

  // 1. 기본 명령 실행
  console.log('--- 1. 기본 명령 실행 ---')
  const cmd1 = createPostStatusCmd(service, '첫 번째 게시물!')
  invoker.run(cmd1)

  const cmd2 = createPostStatusCmd(service, '두 번째 게시물!')
  invoker.run(cmd2)

  console.log('\n타임라인:', service.getTimeline())

  // 2. 실행 취소
  console.log('\n--- 2. 실행 취소 ---')
  invoker.undo()
  console.log('타임라인:', service.getTimeline())

  // 3. 지연 실행
  console.log('\n--- 3. 지연 실행 (1초 후) ---')
  const cmd3 = createPostStatusCmd(service, '지연된 게시물!')
  invoker.delay(cmd3, 1000)

  // 지연 실행 완료 대기
  await new Promise(resolve => setTimeout(resolve, 1500))
  console.log('타임라인:', service.getTimeline())

  // 4. 직렬화 및 복원
  console.log('\n--- 4. 직렬화 및 복원 ---')
  const cmd4 = createPostStatusCmd(service, '직렬화할 게시물!')
  const serialized = invoker.serialize(cmd4)

  // 새로운 서비스에서 복원 실행
  const newService = new StatusUpdateService()
  invoker.runSerialized(serialized, newService)
  console.log('새 타임라인:', newService.getTimeline())

  // 5. 복합 명령
  console.log('\n--- 5. 복합 명령 ---')
  const batchService = new StatusUpdateService()
  const batchInvoker = new CommandInvoker()

  const composite = new CompositeCommand([
    createPostStatusCmd(batchService, '배치 1'),
    createPostStatusCmd(batchService, '배치 2'),
    createPostStatusCmd(batchService, '배치 3')
  ])

  console.log('복합 명령 실행:')
  batchInvoker.run(composite)
  console.log('타임라인:', batchService.getTimeline())

  console.log('\n복합 명령 취소:')
  batchInvoker.undo()
  console.log('타임라인:', batchService.getTimeline())

  console.log('\n=== 명령 패턴 테스트 완료 ===')
}

main().catch(console.error)
