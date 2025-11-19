/**
 * 커스텀 Transform 스트림 구현 예제
 *
 * 사용법:
 *   echo "Hello World" | node replace-stream.js World Node.js
 *   cat input.txt | node replace-stream.js oldtext newtext
 *
 * 특징:
 *   - Transform 스트림의 기본 구조 학습
 *   - 청크 경계를 넘어가는 패턴 처리
 *   - _transform()과 _flush() 메서드 구현
 */

import { Transform } from 'stream'
import { pipeline } from 'stream/promises'

class ReplaceStream extends Transform {
  constructor(searchStr, replaceStr, options) {
    super(options)
    this.searchStr = searchStr
    this.replaceStr = replaceStr
    this.tail = ''
  }

  _transform(chunk, encoding, callback) {
    // 이전 청크의 남은 부분과 현재 청크를 결합
    const pieces = (this.tail + chunk).split(this.searchStr)

    // 마지막 조각은 다음 청크와 결합될 수 있으므로 보관
    this.tail = pieces[pieces.length - 1]

    // 마지막 조각을 제외한 모든 조각 처리
    for (let i = 0; i < pieces.length - 1; i++) {
      this.push(pieces[i] + this.replaceStr)
    }

    callback()
  }

  _flush(callback) {
    // 스트림 종료 시 남은 데이터 처리
    this.push(this.tail)
    callback()
  }
}

// CLI 인자 파싱
const searchStr = process.argv[2]
const replaceStr = process.argv[3]

if (!searchStr || !replaceStr) {
  console.error('사용법: echo "text" | node replace-stream.js <search> <replace>')
  console.error('예시: echo "Hello World" | node replace-stream.js World Node.js')
  process.exit(1)
}

// stdin → ReplaceStream → stdout
async function main() {
  try {
    await pipeline(
      process.stdin,
      new ReplaceStream(searchStr, replaceStr),
      process.stdout
    )
  } catch (err) {
    if (err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      console.error('에러:', err.message)
      process.exit(1)
    }
  }
}

main()
