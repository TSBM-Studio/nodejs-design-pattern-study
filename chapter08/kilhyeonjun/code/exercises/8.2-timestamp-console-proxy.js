/**
 * Chapter 8: 구조적 설계 패턴 - 연습문제
 * 8.2 로그의 타임스탬프 찍기
 *
 * console 객체에 대한 프록시를 만들어
 * 모든 로깅 함수(log, error, debug, info)에
 * 현재 타임스탬프를 추가합니다.
 *
 * 예: consoleProxy.log('hello')
 * 출력: "2020-02-18T15:59:30.699Z hello"
 */

/**
 * 타임스탬프를 추가하는 console 프록시 생성
 * @param {Console} originalConsole - 원본 console 객체
 * @param {Object} options - 옵션
 * @param {string} options.format - 시간 형식 ('iso' | 'locale' | 'unix')
 * @returns {Proxy} 타임스탬프가 추가된 console 프록시
 */
export function createTimestampConsole(originalConsole = console, options = {}) {
  const { format = 'iso' } = options

  // 타임스탬프 생성 함수
  function getTimestamp() {
    const now = new Date()
    switch (format) {
      case 'locale':
        return now.toLocaleString()
      case 'unix':
        return now.getTime().toString()
      case 'iso':
      default:
        return now.toISOString()
    }
  }

  // 로깅 함수 목록
  const loggingMethods = ['log', 'error', 'debug', 'info', 'warn']

  return new Proxy(originalConsole, {
    get(target, property) {
      // 로깅 함수인 경우 타임스탬프 추가
      if (loggingMethods.includes(property)) {
        return function (...args) {
          const timestamp = getTimestamp()
          return target[property](timestamp, ...args)
        }
      }
      // 다른 속성/함수는 그대로 반환
      return target[property]
    }
  })
}

/**
 * 더 상세한 포맷팅 옵션을 제공하는 버전
 */
export function createAdvancedTimestampConsole(originalConsole = console, options = {}) {
  const {
    format = 'iso',
    prefix = '',
    suffix = '',
    colorize = false,
    includeLevel = false
  } = options

  // ANSI 색상 코드
  const colors = {
    log: '\x1b[0m',      // 기본
    info: '\x1b[36m',    // cyan
    warn: '\x1b[33m',    // yellow
    error: '\x1b[31m',   // red
    debug: '\x1b[35m',   // magenta
    reset: '\x1b[0m'
  }

  function getTimestamp() {
    const now = new Date()
    switch (format) {
      case 'locale':
        return now.toLocaleString()
      case 'time':
        return now.toLocaleTimeString()
      case 'date':
        return now.toLocaleDateString()
      case 'unix':
        return now.getTime().toString()
      case 'custom':
        // HH:mm:ss.SSS 형식
        return `${now.getHours().toString().padStart(2, '0')}:` +
               `${now.getMinutes().toString().padStart(2, '0')}:` +
               `${now.getSeconds().toString().padStart(2, '0')}.` +
               `${now.getMilliseconds().toString().padStart(3, '0')}`
      case 'iso':
      default:
        return now.toISOString()
    }
  }

  const loggingMethods = ['log', 'error', 'debug', 'info', 'warn']

  return new Proxy(originalConsole, {
    get(target, property) {
      if (loggingMethods.includes(property)) {
        return function (...args) {
          const timestamp = getTimestamp()
          const level = includeLevel ? `[${property.toUpperCase()}]` : ''

          let formattedPrefix = `${prefix}${timestamp}${level}${suffix}`

          if (colorize && colors[property]) {
            formattedPrefix = `${colors[property]}${formattedPrefix}${colors.reset}`
          }

          return target[property](formattedPrefix, ...args)
        }
      }
      return target[property]
    }
  })
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 타임스탬프 콘솔 프록시 테스트 ===\n')

  // 기본 버전
  console.log('--- 기본 (ISO 형식) ---')
  const consoleProxy = createTimestampConsole()
  consoleProxy.log('hello')
  consoleProxy.info('정보 메시지')
  consoleProxy.warn('경고 메시지')
  consoleProxy.error('에러 메시지')

  // locale 형식
  console.log('\n--- locale 형식 ---')
  const localeConsole = createTimestampConsole(console, { format: 'locale' })
  localeConsole.log('로컬 시간 형식')

  // unix 형식
  console.log('\n--- unix 형식 ---')
  const unixConsole = createTimestampConsole(console, { format: 'unix' })
  unixConsole.log('유닉스 타임스탬프')

  // 고급 버전
  console.log('\n--- 고급 버전 (색상 + 레벨) ---')
  const advancedConsole = createAdvancedTimestampConsole(console, {
    format: 'custom',
    prefix: '[',
    suffix: ']',
    colorize: true,
    includeLevel: true
  })
  advancedConsole.log('일반 로그')
  advancedConsole.info('정보 메시지')
  advancedConsole.warn('경고 메시지')
  advancedConsole.error('에러 메시지')
  advancedConsole.debug('디버그 메시지')

  // 원본 console은 변경되지 않음
  console.log('\n--- 원본 console (변경 없음) ---')
  console.log('타임스탬프 없는 원본 메시지')
}
