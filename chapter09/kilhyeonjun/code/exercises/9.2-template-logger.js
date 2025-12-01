/**
 * 연습문제 9.2: 템플릿을 사용한 로깅
 *
 * 템플릿 패턴을 사용하여 로깅 클래스를 구현합니다.
 * 기본 클래스에서 로그 포맷팅을 담당하고,
 * 파생 클래스에서 출력 대상을 결정합니다.
 *
 * 클래스:
 * - Logger (템플릿): 포맷팅 담당
 * - ConsoleLogger: 콘솔 출력
 * - FileLogger: 파일 출력
 */

import { promises as fs } from 'fs'
import { appendFileSync } from 'fs'

// ============================================
// 템플릿 클래스
// ============================================

class Logger {
  /**
   * 템플릿 메서드: 로그 포맷팅 및 출력
   * 알고리즘의 구조를 정의
   */
  log(level, message) {
    // 1. 타임스탬프 생성
    const timestamp = this._getTimestamp()

    // 2. 포맷팅
    const formatted = this._format(timestamp, level, message)

    // 3. 출력 (파생 클래스에서 구현)
    this._output(level, formatted)
  }

  /**
   * 타임스탬프 생성 (오버라이드 가능)
   */
  _getTimestamp() {
    return new Date().toISOString()
  }

  /**
   * 로그 포맷팅 (오버라이드 가능)
   */
  _format(timestamp, level, message) {
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`
  }

  /**
   * 추상 메서드: 출력 (파생 클래스에서 구현)
   */
  _output(level, formatted) {
    throw new Error('_output() must be implemented by subclass')
  }

  // 편의 메서드들
  debug(message) {
    this.log('debug', message)
  }

  info(message) {
    this.log('info', message)
  }

  warn(message) {
    this.log('warn', message)
  }

  error(message) {
    this.log('error', message)
  }
}

// ============================================
// 구체적 구현 클래스들
// ============================================

/**
 * 콘솔 로거
 */
class ConsoleLogger extends Logger {
  _output(level, formatted) {
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
 * 파일 로거
 */
class FileLogger extends Logger {
  constructor(filePath) {
    super()
    this.filePath = filePath
  }

  _output(level, formatted) {
    appendFileSync(this.filePath, formatted + '\n', 'utf-8')
  }
}

/**
 * 컬러 콘솔 로거 (포맷 커스터마이즈)
 */
class ColorConsoleLogger extends Logger {
  constructor() {
    super()
    this.colors = {
      debug: '\x1b[90m',   // 회색
      info: '\x1b[36m',    // 청록
      warn: '\x1b[33m',    // 노랑
      error: '\x1b[31m',   // 빨강
      reset: '\x1b[0m'
    }
  }

  _format(timestamp, level, message) {
    const color = this.colors[level] || this.colors.reset
    const reset = this.colors.reset
    return `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`
  }

  _output(level, formatted) {
    console.log(formatted)
  }
}

/**
 * JSON 파일 로거 (포맷 완전 커스터마이즈)
 */
class JsonFileLogger extends Logger {
  constructor(filePath) {
    super()
    this.filePath = filePath
  }

  // 포맷팅을 완전히 재정의
  _format(timestamp, level, message) {
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message
    })
  }

  _output(level, formatted) {
    appendFileSync(this.filePath, formatted + '\n', 'utf-8')
  }
}

/**
 * 타임스탬프 포맷 커스터마이즈 로거
 */
class SimpleTimestampLogger extends ConsoleLogger {
  _getTimestamp() {
    const now = new Date()
    return `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
  }

  _format(timestamp, level, message) {
    return `${timestamp} | ${level.toUpperCase().padEnd(5)} | ${message}`
  }
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== 연습문제 9.2: 템플릿을 사용한 로깅 ===\n')

  const tempDir = '/tmp/template-logger-test'
  await fs.mkdir(tempDir, { recursive: true })

  // 1. 콘솔 로거
  console.log('--- 1. ConsoleLogger ---')
  const consoleLogger = new ConsoleLogger()
  consoleLogger.info('콘솔 로거 테스트')
  consoleLogger.debug('디버그 메시지')
  consoleLogger.warn('경고 메시지')
  consoleLogger.error('에러 메시지')
  console.log()

  // 2. 파일 로거
  console.log('--- 2. FileLogger ---')
  const logPath = `${tempDir}/template.log`
  const fileLogger = new FileLogger(logPath)
  fileLogger.info('파일에 기록되는 메시지')
  fileLogger.error('파일에 기록되는 에러')

  const fileContent = await fs.readFile(logPath, 'utf-8')
  console.log('파일 내용:')
  console.log(fileContent)

  // 3. 컬러 콘솔 로거
  console.log('--- 3. ColorConsoleLogger ---')
  const colorLogger = new ColorConsoleLogger()
  colorLogger.debug('회색 디버그 메시지')
  colorLogger.info('청록색 정보 메시지')
  colorLogger.warn('노란색 경고 메시지')
  colorLogger.error('빨간색 에러 메시지')
  console.log()

  // 4. JSON 파일 로거
  console.log('--- 4. JsonFileLogger ---')
  const jsonPath = `${tempDir}/template.json`
  const jsonLogger = new JsonFileLogger(jsonPath)
  jsonLogger.info('JSON 로그 메시지')
  jsonLogger.warn('JSON 경고 메시지')

  const jsonContent = await fs.readFile(jsonPath, 'utf-8')
  console.log('JSON 파일 내용:')
  console.log(jsonContent)

  // 5. 간단한 타임스탬프 로거
  console.log('--- 5. SimpleTimestampLogger ---')
  const simpleLogger = new SimpleTimestampLogger()
  simpleLogger.info('간단한 포맷')
  simpleLogger.debug('디버그')
  simpleLogger.warn('경고')
  simpleLogger.error('에러')

  console.log('\n=== 연습문제 9.2 완료 ===')
}

main().catch(console.error)
