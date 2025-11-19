/**
 * 병렬 처리 스트림 구현 예제
 *
 * 사용법:
 *   node parallel-stream.js <urls-file>
 *
 * 특징:
 *   - 동시성 제어 (concurrency 옵션)
 *   - 비순차 병렬 처리
 *   - Backpressure 처리
 */

import { Transform } from 'stream'
import { createReadStream, createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import split from 'split2'

class ParallelStream extends Transform {
  constructor(userTransform, options = {}) {
    super({ objectMode: true, ...options })
    this.userTransform = userTransform
    this.running = 0
    this.continueCallback = null
    this.concurrency = options.concurrency || 2
  }

  _transform(chunk, encoding, callback) {
    this.running++

    this.userTransform(chunk, encoding, this.push.bind(this), (err) => {
      this.running--

      if (err) {
        return callback(err)
      }

      if (this.running === 0) {
        // 모든 작업 완료
        this.continueCallback?.()
      }
    })

    // 동시성 제한 체크
    if (this.running < this.concurrency) {
      callback()
    } else {
      // 동시성 제한 도달 - 작업 완료 대기
      this.continueCallback = callback
    }
  }

  _flush(callback) {
    if (this.running > 0) {
      // 진행 중인 작업이 있으면 대기
      this.continueCallback = callback
    } else {
      callback()
    }
  }
}

// URL 체크 함수
async function checkUrl(url, encoding, push, callback) {
  if (!url || url.trim() === '') {
    return callback()
  }

  url = url.trim()

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })

    clearTimeout(timeout)

    const status = response.ok ? '✅' : '❌'
    push(`${status} ${url} (${response.status})\n`)
    callback()
  } catch (err) {
    push(`❌ ${url} (${err.message})\n`)
    callback()
  }
}

// 메인 함수
async function main() {
  const inputFile = process.argv[2]

  if (!inputFile) {
    console.error('사용법: node parallel-stream.js <urls-file>')
    console.error('\nurls-file 형식:')
    console.error('https://example.com')
    console.error('https://google.com')
    console.error('https://github.com')
    process.exit(1)
  }

  console.log('URL 체크 시작...\n')

  try {
    await pipeline(
      createReadStream(inputFile),
      split(), // 라인별로 분할
      new ParallelStream(checkUrl, { concurrency: 5 }),
      process.stdout
    )

    console.log('\n✅ 완료!')
  } catch (err) {
    console.error('\n❌ 에러:', err.message)
    process.exit(1)
  }
}

main()
