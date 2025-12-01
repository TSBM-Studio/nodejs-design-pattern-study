/**
 * Chapter 8: 구조적 설계 패턴
 * 05-logging-writable.js - Writable 스트림에 대한 로깅 프록시
 *
 * write() 함수에 대한 모든 호출을 가로채고 로깅하는
 * Writable 스트림 프록시를 구현합니다.
 */

import { createWriteStream } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Writable 스트림에 로깅 기능을 추가하는 프록시 팩토리
 * @param {Writable} writable - 프록시할 Writable 스트림
 * @returns {Proxy} 로깅이 추가된 프록시 스트림
 */
export function createLoggingWritable(writable) {
  return new Proxy(writable, {
    get(target, propKey, receiver) {
      // write 함수 접근을 가로챔
      if (propKey === 'write') {
        return function (...args) {
          // 기록할 청크 추출
          const [chunk] = args
          console.log('Writing:', chunk)
          // 원래 함수 호출
          return writable.write(...args)
        }
      }
      // 다른 모든 속성은 변경 없이 반환
      return target[propKey]
    }
  })
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const testFilePath = join(__dirname, 'test-output.txt')
  const writable = createWriteStream(testFilePath)
  const writableProxy = createLoggingWritable(writable)

  console.log('=== 로깅 프록시 테스트 ===\n')

  // 프록시를 통한 쓰기 - 로깅됨
  writableProxy.write('First chunk\n')
  writableProxy.write('Second chunk\n')

  // 원본 스트림을 통한 쓰기 - 로깅 안됨
  console.log('\n--- 원본 스트림 사용 (로깅 없음) ---')
  writable.write('This is not logged\n')

  // 프록시로 다시 쓰기
  console.log('\n--- 프록시 스트림 사용 (로깅됨) ---')
  writableProxy.write('Third chunk\n')

  // 스트림 종료
  writableProxy.end()

  console.log(`\n파일이 ${testFilePath}에 저장되었습니다.`)
}
