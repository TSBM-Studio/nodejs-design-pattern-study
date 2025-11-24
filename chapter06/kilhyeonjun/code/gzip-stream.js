/**
 * 스트리밍을 사용한 파일 압축 예제
 *
 * 사용법:
 *   node gzip-stream.js <filename>
 *
 * 특징:
 *   - 파일 크기와 무관하게 일정한 메모리 사용
 *   - pipeline()을 사용한 에러 처리
 */

import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'
import { pipeline } from 'stream/promises'

const filename = process.argv[2]

if (!filename) {
  console.error('사용법: node gzip-stream.js <filename>')
  process.exit(1)
}

async function compressFile(inputFile) {
  const startTime = Date.now()

  try {
    await pipeline(
      createReadStream(inputFile),
      createGzip(),
      createWriteStream(`${inputFile}.gz`)
    )

    const duration = Date.now() - startTime
    console.log(`✅ 압축 완료: ${inputFile}.gz (${duration}ms)`)
  } catch (err) {
    console.error('❌ 압축 실패:', err.message)
    process.exit(1)
  }
}

compressFile(filename)
