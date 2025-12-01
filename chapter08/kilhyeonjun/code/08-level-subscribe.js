/**
 * Chapter 8: 구조적 설계 패턴
 * 08-level-subscribe.js - LevelUP 플러그인 데코레이터
 *
 * 특정 패턴의 객체가 데이터베이스에 저장될 때
 * 알림을 받을 수 있도록 하는 LevelUP 플러그인입니다.
 *
 * 참고: 이 예제를 실행하려면 level 패키지가 필요합니다.
 * npm install level
 */

/**
 * LevelUP 데이터베이스에 subscribe 기능을 추가하는 데코레이터
 * @param {Object} db - LevelUP 데이터베이스 인스턴스
 * @returns {Object} 데코레이트된 데이터베이스 인스턴스
 */
export function levelSubscribe(db) {
  // subscribe 함수를 db 객체에 추가 (객체 확장)
  db.subscribe = (pattern, listener) => {
    // 데이터베이스의 put 이벤트를 수신
    db.on('put', (key, val) => {
      // 패턴 매칭: 제공된 패턴의 모든 속성이 값에 존재하는지 검사
      const match = Object.keys(pattern).every(
        k => (pattern[k] === val[k])
      )
      // 패턴이 일치하면 리스너에게 알림
      if (match) {
        listener(key, val)
      }
    })
  }
  return db
}

// 테스트 실행 (level 패키지가 설치된 경우)
async function runTest() {
  try {
    // 동적 import로 level 패키지 로드
    const { Level } = await import('level')
    const { dirname, join } = await import('path')
    const { fileURLToPath } = await import('url')

    const __dirname = dirname(fileURLToPath(import.meta.url))
    const dbPath = join(__dirname, 'level-subscribe-db')

    // 데이터베이스 초기화
    const db = new Level(dbPath, { valueEncoding: 'json' })

    // 데코레이터 적용
    levelSubscribe(db)

    console.log('=== LevelUP Subscribe 플러그인 테스트 ===\n')

    // 영어 트윗 구독
    db.subscribe(
      { doctype: 'tweet', language: 'en' },
      (k, val) => console.log('[English Tweet]', val)
    )

    // 회사 문서 구독
    db.subscribe(
      { doctype: 'company' },
      (k, val) => console.log('[Company]', val)
    )

    console.log('구독 설정 완료. 데이터 저장 중...\n')

    // 영어 트윗 저장 - 구독자에게 알림
    await db.put('1', {
      doctype: 'tweet',
      text: 'Hello World!',
      language: 'en'
    })

    // 한국어 트윗 저장 - 영어 트윗 구독자에게 알림 없음
    await db.put('2', {
      doctype: 'tweet',
      text: '안녕하세요!',
      language: 'ko'
    })

    // 회사 문서 저장 - 회사 문서 구독자에게 알림
    await db.put('3', {
      doctype: 'company',
      name: 'ACME Co.'
    })

    // 다른 영어 트윗 저장
    await db.put('4', {
      doctype: 'tweet',
      text: 'Node.js is awesome!',
      language: 'en'
    })

    console.log('\n테스트 완료. 데이터베이스 종료...')
    await db.close()
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('=== LevelUP Subscribe 플러그인 (시뮬레이션) ===\n')
      console.log('level 패키지가 설치되지 않아 시뮬레이션 모드로 실행합니다.')
      console.log('실제 테스트를 위해서는: npm install level\n')

      // 간단한 시뮬레이션
      const mockDb = {
        listeners: {},
        on(event, callback) {
          if (!this.listeners[event]) {
            this.listeners[event] = []
          }
          this.listeners[event].push(callback)
        },
        emit(event, ...args) {
          if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(...args))
          }
        },
        put(key, val) {
          console.log(`Storing: ${key} =>`, val)
          this.emit('put', key, val)
        }
      }

      levelSubscribe(mockDb)

      mockDb.subscribe(
        { doctype: 'tweet', language: 'en' },
        (k, val) => console.log('[English Tweet]', val)
      )

      console.log('--- 데이터 저장 시뮬레이션 ---\n')
      mockDb.put('1', { doctype: 'tweet', text: 'Hello!', language: 'en' })
      mockDb.put('2', { doctype: 'tweet', text: '안녕!', language: 'ko' })
      mockDb.put('3', { doctype: 'company', name: 'ACME' })
    } else {
      throw err
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTest()
}
