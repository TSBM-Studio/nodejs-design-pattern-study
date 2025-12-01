/**
 * 연습문제 9.4: 미들웨어를 사용한 로깅
 *
 * 미들웨어 패턴을 사용하여 로그 메시지를 처리하는
 * 파이프라인을 구현합니다.
 *
 * 미들웨어:
 * - serialize(): 로그 객체를 문자열로 직렬화
 * - saveToFile(): 직렬화된 로그를 파일에 저장
 * - timestampMiddleware(): 타임스탬프 추가
 * - filterMiddleware(): 특정 레벨 이하 필터링
 */

import { promises as fs } from 'fs'
import { appendFileSync } from 'fs'

// ============================================
// 미들웨어 관리자 (Koa 스타일)
// ============================================

class LoggingPipeline {
  constructor() {
    this.middlewares = []
  }

  use(middleware) {
    this.middlewares.push(middleware)
    return this
  }

  async run(logEntry) {
    const dispatch = (index) => {
      if (index >= this.middlewares.length) {
        return Promise.resolve()
      }

      const middleware = this.middlewares[index]
      return Promise.resolve(
        middleware(logEntry, () => dispatch(index + 1))
      )
    }

    return dispatch(0)
  }
}

// ============================================
// 미들웨어 정의
// ============================================

/**
 * 타임스탬프 미들웨어 - 로그에 타임스탬프 추가
 */
function timestampMiddleware() {
  return async (log, next) => {
    log.timestamp = new Date().toISOString()
    await next()
  }
}

/**
 * 레벨 필터 미들웨어 - 특정 레벨 이하 필터링
 * @param {string} minLevel - 최소 로그 레벨
 */
function filterMiddleware(minLevel) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 }

  return async (log, next) => {
    const minLevelNum = levels[minLevel] || 0
    const logLevelNum = levels[log.level] || 0

    if (logLevelNum >= minLevelNum) {
      await next()
    } else {
      log.filtered = true
    }
  }
}

/**
 * 직렬화 미들웨어 - 로그 객체를 문자열로 변환
 * @param {string} format - 'text' 또는 'json'
 */
function serializeMiddleware(format = 'text') {
  return async (log, next) => {
    if (format === 'json') {
      log.serialized = JSON.stringify({
        timestamp: log.timestamp,
        level: log.level,
        message: log.message,
        ...(log.meta && { meta: log.meta })
      })
    } else {
      const meta = log.meta ? ` ${JSON.stringify(log.meta)}` : ''
      log.serialized = `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${meta}`
    }
    await next()
  }
}

/**
 * 파일 저장 미들웨어 - 직렬화된 로그를 파일에 저장
 * @param {string} filePath - 저장할 파일 경로
 */
function saveToFileMiddleware(filePath) {
  return async (log, next) => {
    if (log.serialized) {
      appendFileSync(filePath, log.serialized + '\n', 'utf-8')
      log.savedToFile = true
    }
    await next()
  }
}

/**
 * 콘솔 출력 미들웨어
 */
function consoleMiddleware() {
  return async (log, next) => {
    if (log.serialized) {
      console.log(log.serialized)
    }
    await next()
  }
}

/**
 * 메타데이터 추가 미들웨어
 * @param {Object} meta - 추가할 메타데이터
 */
function metaMiddleware(meta) {
  return async (log, next) => {
    log.meta = { ...log.meta, ...meta }
    await next()
  }
}

/**
 * 에러 알림 미들웨어 - 에러 레벨일 때 알림
 */
function errorAlertMiddleware() {
  return async (log, next) => {
    await next()

    if (log.level === 'error' && !log.filtered) {
      console.log(`⚠️  에러 알림: ${log.message}`)
    }
  }
}

// ============================================
// Logger 클래스
// ============================================

class Logger {
  constructor(pipeline) {
    this.pipeline = pipeline
  }

  async log(level, message, meta = null) {
    const logEntry = { level, message, meta }
    await this.pipeline.run(logEntry)
    return logEntry
  }

  async debug(message, meta) {
    return this.log('debug', message, meta)
  }

  async info(message, meta) {
    return this.log('info', message, meta)
  }

  async warn(message, meta) {
    return this.log('warn', message, meta)
  }

  async error(message, meta) {
    return this.log('error', message, meta)
  }
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== 연습문제 9.4: 미들웨어를 사용한 로깅 ===\n')

  const tempDir = '/tmp/middleware-logger-test'
  await fs.mkdir(tempDir, { recursive: true })
  const logPath = `${tempDir}/app.log`

  // 파이프라인 구성
  const pipeline = new LoggingPipeline()
  pipeline
    .use(timestampMiddleware())           // 1. 타임스탬프 추가
    .use(filterMiddleware('info'))        // 2. info 이상만 통과
    .use(metaMiddleware({ app: 'test' })) // 3. 메타데이터 추가
    .use(serializeMiddleware('text'))     // 4. 텍스트 형식 직렬화
    .use(consoleMiddleware())             // 5. 콘솔 출력
    .use(saveToFileMiddleware(logPath))   // 6. 파일 저장
    .use(errorAlertMiddleware())          // 7. 에러 알림

  const logger = new Logger(pipeline)

  // 1. 기본 로깅 테스트
  console.log('--- 1. 기본 로깅 테스트 ---')
  await logger.info('애플리케이션 시작')
  await logger.warn('메모리 사용량 높음', { usage: '85%' })
  await logger.error('데이터베이스 연결 실패', { code: 'ECONNREFUSED' })
  console.log()

  // 2. 필터링된 로그 (debug는 출력 안 됨)
  console.log('--- 2. 필터링 테스트 (debug는 필터됨) ---')
  const debugLog = await logger.debug('디버그 메시지')
  console.log(`debug 로그 필터됨: ${debugLog.filtered === true}`)
  console.log()

  // 3. 파일 내용 확인
  console.log('--- 3. 저장된 파일 내용 ---')
  const fileContent = await fs.readFile(logPath, 'utf-8')
  console.log(fileContent)

  // 4. JSON 형식 파이프라인
  console.log('--- 4. JSON 형식 로깅 ---')
  const jsonPath = `${tempDir}/app.json`

  const jsonPipeline = new LoggingPipeline()
  jsonPipeline
    .use(timestampMiddleware())
    .use(serializeMiddleware('json'))
    .use(consoleMiddleware())
    .use(saveToFileMiddleware(jsonPath))

  const jsonLogger = new Logger(jsonPipeline)
  await jsonLogger.info('JSON 형식 로그', { userId: 123 })
  await jsonLogger.error('JSON 에러', { stack: 'Error: test' })
  console.log()

  // 5. JSON 파일 내용 확인
  console.log('--- 5. JSON 파일 내용 ---')
  const jsonContent = await fs.readFile(jsonPath, 'utf-8')
  console.log(jsonContent)

  console.log('=== 연습문제 9.4 완료 ===')
}

main().catch(console.error)
