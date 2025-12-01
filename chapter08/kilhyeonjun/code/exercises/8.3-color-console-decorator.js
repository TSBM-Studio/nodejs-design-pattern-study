/**
 * Chapter 8: 구조적 설계 패턴 - 연습문제
 * 8.3 컬러 콘솔 출력
 *
 * console 객체에 red(), yellow(), green() 함수를 추가하는 데코레이터입니다.
 * 이 함수들은 console.log()처럼 동작하지만,
 * 메시지를 각각 빨간색, 노란색, 초록색으로 출력합니다.
 *
 * 참고: ANSI 이스케이프 코드를 사용합니다.
 */

// ANSI 색상 코드
const COLORS = {
  reset: '\x1b[0m',
  // 기본 색상
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  // 밝은 색상
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  // 배경 색상
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  // 스타일
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m'
}

/**
 * 컬러 출력 함수를 추가하는 console 데코레이터
 * @param {Console} originalConsole - 원본 console 객체
 * @returns {Object} 데코레이트된 console 객체
 */
export function createColorConsole(originalConsole = console) {
  // 색상 출력 함수 생성기
  function createColorMethod(colorCode) {
    return function (...args) {
      // 모든 인자를 문자열로 변환하고 색상 적용
      const coloredArgs = args.map(arg => {
        if (typeof arg === 'string') {
          return `${colorCode}${arg}${COLORS.reset}`
        }
        return arg
      })
      originalConsole.log(...coloredArgs)
    }
  }

  // 데코레이트된 객체 생성
  const colorConsole = {
    // 기본 색상 함수
    red: createColorMethod(COLORS.red),
    green: createColorMethod(COLORS.green),
    yellow: createColorMethod(COLORS.yellow),
    blue: createColorMethod(COLORS.blue),
    magenta: createColorMethod(COLORS.magenta),
    cyan: createColorMethod(COLORS.cyan),

    // 밝은 색상 함수
    brightRed: createColorMethod(COLORS.brightRed),
    brightGreen: createColorMethod(COLORS.brightGreen),
    brightYellow: createColorMethod(COLORS.brightYellow),

    // 스타일 함수
    bold: createColorMethod(COLORS.bold),
    dim: createColorMethod(COLORS.dim),
    underline: createColorMethod(COLORS.underline),

    // 조합 함수
    success: createColorMethod(COLORS.brightGreen + COLORS.bold),
    warning: createColorMethod(COLORS.brightYellow + COLORS.bold),
    error: createColorMethod(COLORS.brightRed + COLORS.bold),
    info: createColorMethod(COLORS.brightCyan)
  }

  // 원본 console의 모든 속성 복사
  for (const key of Object.keys(originalConsole)) {
    if (!(key in colorConsole)) {
      colorConsole[key] = originalConsole[key]
    }
  }

  // 원본 함수들도 포함
  colorConsole.log = originalConsole.log.bind(originalConsole)
  colorConsole.warn = originalConsole.warn.bind(originalConsole)
  colorConsole.error = originalConsole.error.bind(originalConsole)
  colorConsole.info = originalConsole.info.bind(originalConsole)

  return colorConsole
}

/**
 * Proxy 객체를 사용한 컬러 콘솔 데코레이터
 */
export function createColorConsoleProxy(originalConsole = console) {
  const colorMethods = {
    red: COLORS.red,
    green: COLORS.green,
    yellow: COLORS.yellow,
    blue: COLORS.blue,
    magenta: COLORS.magenta,
    cyan: COLORS.cyan,
    success: COLORS.brightGreen + COLORS.bold,
    warning: COLORS.brightYellow + COLORS.bold,
    errorColor: COLORS.brightRed + COLORS.bold,
    info: COLORS.brightCyan
  }

  return new Proxy(originalConsole, {
    get(target, property) {
      // 색상 메서드 요청인 경우
      if (property in colorMethods) {
        return function (...args) {
          const colorCode = colorMethods[property]
          const coloredArgs = args.map(arg => {
            if (typeof arg === 'string') {
              return `${colorCode}${arg}${COLORS.reset}`
            }
            return arg
          })
          target.log(...coloredArgs)
        }
      }
      // 원본 속성 반환
      return target[property]
    }
  })
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== 컬러 콘솔 데코레이터 테스트 ===\n')

  // 객체 확장 버전
  console.log('--- 객체 확장 버전 ---')
  const colorConsole = createColorConsole()

  colorConsole.red('빨간색 메시지')
  colorConsole.yellow('노란색 메시지')
  colorConsole.green('초록색 메시지')
  colorConsole.blue('파란색 메시지')
  colorConsole.magenta('마젠타 메시지')
  colorConsole.cyan('시안 메시지')

  console.log()
  console.log('--- 밝은 색상 ---')
  colorConsole.brightRed('밝은 빨간색')
  colorConsole.brightGreen('밝은 초록색')
  colorConsole.brightYellow('밝은 노란색')

  console.log()
  console.log('--- 스타일 ---')
  colorConsole.bold('굵은 글씨')
  colorConsole.dim('흐린 글씨')
  colorConsole.underline('밑줄 글씨')

  console.log()
  console.log('--- 시맨틱 함수 ---')
  colorConsole.success('작업이 성공적으로 완료되었습니다!')
  colorConsole.warning('주의: 이 작업은 되돌릴 수 없습니다.')
  colorConsole.error('오류가 발생했습니다!')
  colorConsole.info('참고: 새로운 버전이 있습니다.')

  // Proxy 버전
  console.log()
  console.log('--- Proxy 버전 ---')
  const proxyConsole = createColorConsoleProxy()

  proxyConsole.red('프록시 빨간색')
  proxyConsole.green('프록시 초록색')
  proxyConsole.yellow('프록시 노란색')

  // 원본 console 함수도 동작
  console.log()
  console.log('--- 원본 함수도 사용 가능 ---')
  colorConsole.log('일반 log 함수')
  proxyConsole.log('프록시 일반 log')

  // 여러 인자 전달
  console.log()
  console.log('--- 여러 인자 ---')
  colorConsole.green('성공:', 'User created', { id: 1, name: 'John' })
}
