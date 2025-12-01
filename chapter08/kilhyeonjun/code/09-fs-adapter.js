/**
 * Chapter 8: 구조적 설계 패턴
 * 09-fs-adapter.js - fs API 어댑터
 *
 * LevelUP API를 fs 모듈과 호환되는 인터페이스로 변환하는 어댑터입니다.
 * readFile()과 writeFile() 호출을 db.get()과 db.put()으로 변환합니다.
 *
 * 참고: 이 예제를 실행하려면 level 패키지가 필요합니다.
 * npm install level
 */

import { resolve } from 'path'

/**
 * LevelUP 데이터베이스를 fs API로 사용할 수 있는 어댑터 생성
 * @param {Object} db - LevelUP 데이터베이스 인스턴스
 * @returns {Object} fs API 호환 객체
 */
export function createFSAdapter(db) {
  return ({
    /**
     * 파일 읽기 (db.get으로 변환)
     */
    readFile(filename, options, callback) {
      // 인자 정규화
      if (typeof options === 'function') {
        callback = options
        options = {}
      } else if (typeof options === 'string') {
        options = { encoding: options }
      }

      // db.get() 호출
      db.get(resolve(filename), {
        valueEncoding: options.encoding
      }, (err, value) => {
        if (err) {
          // NotFoundError를 ENOENT 에러로 변환 (fs.readFile과 동일한 동작)
          if (err.type === 'NotFoundError' || err.code === 'LEVEL_NOT_FOUND') {
            err = new Error(`ENOENT, open '${filename}'`)
            err.code = 'ENOENT'
            err.errno = 34
            err.path = filename
          }
          return callback && callback(err)
        }
        callback && callback(null, value)
      })
    },

    /**
     * 파일 쓰기 (db.put으로 변환)
     */
    writeFile(filename, contents, options, callback) {
      // 인자 정규화
      if (typeof options === 'function') {
        callback = options
        options = {}
      } else if (typeof options === 'string') {
        options = { encoding: options }
      }

      // db.put() 호출
      db.put(resolve(filename), contents, {
        valueEncoding: options.encoding
      }, callback)
    }
  })
}

// 테스트 실행
async function runTest() {
  try {
    // 동적 import로 level 패키지 로드
    const { Level } = await import('level')
    const { dirname, join } = await import('path')
    const { fileURLToPath } = await import('url')

    const __dirname = dirname(fileURLToPath(import.meta.url))
    const dbPath = join(__dirname, 'fs-adapter-db')

    // 데이터베이스 초기화
    const db = new Level(dbPath, { valueEncoding: 'binary' })

    // fs 어댑터 생성
    const fs = createFSAdapter(db)

    console.log('=== fs 어댑터 테스트 ===\n')

    // 파일 쓰기
    fs.writeFile('file.txt', 'Hello from LevelDB!', () => {
      console.log('파일 저장 완료: file.txt')

      // 파일 읽기
      fs.readFile('file.txt', { encoding: 'utf8' }, (err, res) => {
        if (err) {
          return console.error('읽기 에러:', err)
        }
        console.log('파일 읽기 결과:', res)
      })
    })

    // 없는 파일 읽기 시도 (ENOENT 에러 발생)
    setTimeout(() => {
      fs.readFile('missing.txt', { encoding: 'utf8' }, (err, res) => {
        if (err) {
          console.log('\n없는 파일 읽기 시도:')
          console.log('에러 코드:', err.code)  // ENOENT
          console.log('에러 메시지:', err.message)
        }
      })
    }, 100)

    // 정리
    setTimeout(async () => {
      console.log('\n테스트 완료. 데이터베이스 종료...')
      await db.close()
    }, 200)
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('=== fs 어댑터 (시뮬레이션) ===\n')
      console.log('level 패키지가 설치되지 않아 시뮬레이션 모드로 실행합니다.')
      console.log('실제 테스트를 위해서는: npm install level\n')

      // 메모리 기반 간단한 시뮬레이션
      const mockDb = {
        data: new Map(),
        get(key, options, callback) {
          if (this.data.has(key)) {
            callback(null, this.data.get(key))
          } else {
            const err = new Error('Not found')
            err.type = 'NotFoundError'
            callback(err)
          }
        },
        put(key, value, options, callback) {
          this.data.set(key, value)
          callback && callback(null)
        }
      }

      const fs = createFSAdapter(mockDb)

      console.log('--- 파일 쓰기/읽기 시뮬레이션 ---\n')

      fs.writeFile('/test/hello.txt', 'Hello World!', () => {
        console.log('파일 저장 완료: /test/hello.txt')

        fs.readFile('/test/hello.txt', 'utf8', (err, data) => {
          console.log('파일 읽기 결과:', data)
        })

        fs.readFile('/test/missing.txt', 'utf8', (err, data) => {
          if (err) {
            console.log('\n없는 파일 읽기 에러:')
            console.log('- 코드:', err.code)
            console.log('- 메시지:', err.message)
          }
        })
      })
    } else {
      throw err
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTest()
}
