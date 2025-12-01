/**
 * 연습문제 9.1: 전략을 사용한 로깅
 *
 * 전략 패턴을 사용하여 로깅 대상을 런타임에 교체할 수 있는
 * Logger 클래스를 구현합니다.
 *
 * 전략:
 * - ConsoleStrategy: 콘솔에 로그 출력
 * - FileStrategy: 파일에 로그 저장
 */

import { promises as fs } from 'fs'
import { appendFileSync } from 'fs'

// ============================================
// 전략(Strategy) 정의
// ============================================

/**
 * 콘솔 전략 - 로그를 콘솔에 출력
 */
const consoleStrategy = {
  log(level, message) {
    const timestamp = new Date().toISOString()
    const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    switch (level) {
      case 'error':
        console.error(formatted)
        break
      case 'warn':
        console.warn(formatted)
        break
      case 'info':
        console.info(formatted)
        break
      default:
        console.log(formatted)
    }
  }
}

/**
 * 파일 전략 - 로그를 파일에 저장
 */
function createFileStrategy(filePath) {
  return {
    log(level, message) {
      const timestamp = new Date().toISOString()
      const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`

      // 동기적으로 파일에 추가 (간단한 구현)
      appendFileSync(filePath, formatted, 'utf-8')
    }
  }
}

/**
 * JSON 파일 전략 - 로그를 JSON 형식으로 파일에 저장
 */
function createJsonFileStrategy(filePath) {
  return {
    log(level, message) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message
      }

      appendFileSync(filePath, JSON.stringify(logEntry) + '\n', 'utf-8')
    }
  }
}

/**
 * 다중 출력 전략 - 여러 전략에 동시에 로그
 */
function createMultiStrategy(...strategies) {
  return {
    log(level, message) {
      for (const strategy of strategies) {
        strategy.log(level, message)
      }
    }
  }
}

// ============================================
// 컨텍스트(Context) - Logger 클래스
// ============================================

class Logger {
  constructor(strategy = consoleStrategy) {
    this.strategy = strategy
  }

  /**
   * 전략 변경
   */
  setStrategy(strategy) {
    this.strategy = strategy
  }

  /**
   * 로그 레벨별 메서드
   */
  debug(message) {
    this.strategy.log('debug', message)
  }

  info(message) {
    this.strategy.log('info', message)
  }

  warn(message) {
    this.strategy.log('warn', message)
  }

  error(message) {
    this.strategy.log('error', message)
  }

  /**
   * 일반 로그
   */
  log(level, message) {
    this.strategy.log(level, message)
  }
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== 연습문제 9.1: 전략을 사용한 로깅 ===\n')

  const tempDir = '/tmp/strategy-logger-test'
  await fs.mkdir(tempDir, { recursive: true })

  // 1. 콘솔 전략
  console.log('--- 1. 콘솔 전략 ---')
  const logger = new Logger(consoleStrategy)
  logger.info('애플리케이션 시작')
  logger.debug('디버그 메시지')
  logger.warn('경고 메시지')
  logger.error('에러 메시지')
  console.log()

  // 2. 파일 전략으로 변경
  console.log('--- 2. 파일 전략 ---')
  const logPath = `${tempDir}/app.log`
  const fileStrategy = createFileStrategy(logPath)
  logger.setStrategy(fileStrategy)

  logger.info('파일에 기록되는 메시지 1')
  logger.info('파일에 기록되는 메시지 2')
  logger.error('파일에 기록되는 에러')

  // 파일 내용 확인
  const fileContent = await fs.readFile(logPath, 'utf-8')
  console.log('파일 내용:')
  console.log(fileContent)

  // 3. JSON 파일 전략
  console.log('--- 3. JSON 파일 전략 ---')
  const jsonLogPath = `${tempDir}/app.json`
  const jsonStrategy = createJsonFileStrategy(jsonLogPath)
  logger.setStrategy(jsonStrategy)

  logger.info('JSON 형식 로그 1')
  logger.warn('JSON 형식 경고')

  const jsonContent = await fs.readFile(jsonLogPath, 'utf-8')
  console.log('JSON 파일 내용:')
  console.log(jsonContent)

  // 4. 다중 출력 전략
  console.log('--- 4. 다중 출력 전략 ---')
  const multiLogPath = `${tempDir}/multi.log`
  const multiStrategy = createMultiStrategy(
    consoleStrategy,
    createFileStrategy(multiLogPath)
  )
  logger.setStrategy(multiStrategy)

  logger.info('콘솔과 파일에 동시 출력')
  logger.error('에러도 동시 출력')

  const multiContent = await fs.readFile(multiLogPath, 'utf-8')
  console.log('\n다중 출력 파일 내용:')
  console.log(multiContent)

  // 5. 런타임에 전략 교체 시연
  console.log('--- 5. 런타임 전략 교체 ---')
  logger.setStrategy(consoleStrategy)
  logger.info('다시 콘솔로 출력')

  console.log('\n=== 연습문제 9.1 완료 ===')
}

main().catch(console.error)
