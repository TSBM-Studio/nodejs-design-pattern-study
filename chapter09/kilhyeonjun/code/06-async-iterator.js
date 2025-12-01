/**
 * 06-async-iterator.js
 * 비동기 반복자
 *
 * Symbol.asyncIterator와 for await...of를 사용하여
 * 비동기 데이터 소스를 순회하는 방법을 살펴봅니다.
 */

// ============================================
// 1. 기본 비동기 반복자
// ============================================

console.log('=== 1. 기본 비동기 반복자 ===\n')

/**
 * 지연 시간 후 값을 반환하는 비동기 반복자
 */
function createAsyncIterator(items, delay = 100) {
  let index = 0

  return {
    [Symbol.asyncIterator]() {
      return this
    },

    async next() {
      await new Promise(resolve => setTimeout(resolve, delay))

      if (index < items.length) {
        return { value: items[index++], done: false }
      }
      return { value: undefined, done: true }
    }
  }
}

async function test1() {
  const asyncIter = createAsyncIterator(['a', 'b', 'c'], 100)

  console.log('for await...of 로 순회:')
  for await (const item of asyncIter) {
    console.log(`  ${item}`)
  }
  console.log()
}

// ============================================
// 2. 비동기 제너레이터
// ============================================

console.log('=== 2. 비동기 제너레이터 ===\n')

/**
 * async function* 으로 비동기 제너레이터 정의
 */
async function* asyncNumbers(n, delay = 100) {
  for (let i = 1; i <= n; i++) {
    await new Promise(resolve => setTimeout(resolve, delay))
    yield i
  }
}

async function test2() {
  console.log('비동기 제너레이터 순회:')
  for await (const num of asyncNumbers(5, 50)) {
    console.log(`  ${num}`)
  }
  console.log()
}

// ============================================
// 3. URL 페이지네이션 시뮬레이션
// ============================================

console.log('=== 3. 페이지네이션 시뮬레이션 ===\n')

/**
 * API 페이지네이션을 시뮬레이션하는 비동기 제너레이터
 */
async function* fetchPages(totalPages) {
  for (let page = 1; page <= totalPages; page++) {
    // API 호출 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100))

    const data = {
      page,
      items: [`item-${page}-1`, `item-${page}-2`, `item-${page}-3`],
      hasMore: page < totalPages
    }

    console.log(`  페이지 ${page} 로딩 완료`)
    yield data
  }
}

async function test3() {
  console.log('페이지네이션 순회:')
  const allItems = []

  for await (const page of fetchPages(3)) {
    allItems.push(...page.items)
  }

  console.log('모든 아이템:', allItems)
  console.log()
}

// ============================================
// 4. 청크 단위 파일 읽기 시뮬레이션
// ============================================

console.log('=== 4. 청크 단위 읽기 시뮬레이션 ===\n')

async function* readFileChunks(content, chunkSize = 10) {
  for (let i = 0; i < content.length; i += chunkSize) {
    await new Promise(resolve => setTimeout(resolve, 50))
    yield content.slice(i, i + chunkSize)
  }
}

async function test4() {
  const fileContent = 'Hello, this is a sample file content for testing async iteration!'

  console.log('청크 단위로 읽기:')
  let fullContent = ''

  for await (const chunk of readFileChunks(fileContent, 15)) {
    console.log(`  청크: "${chunk}"`)
    fullContent += chunk
  }

  console.log('전체 내용:', fullContent)
  console.log()
}

// ============================================
// 5. 이벤트 스트림 시뮬레이션
// ============================================

console.log('=== 5. 이벤트 스트림 시뮬레이션 ===\n')

async function* eventStream(events) {
  for (const event of events) {
    // 랜덤 지연
    await new Promise(resolve =>
      setTimeout(resolve, Math.random() * 100 + 50)
    )
    yield { type: event.type, data: event.data, timestamp: Date.now() }
  }
}

async function test5() {
  const events = [
    { type: 'click', data: { x: 100, y: 200 } },
    { type: 'keypress', data: { key: 'Enter' } },
    { type: 'scroll', data: { position: 500 } },
    { type: 'click', data: { x: 300, y: 400 } }
  ]

  console.log('이벤트 스트림:')
  for await (const event of eventStream(events)) {
    console.log(`  [${event.type}] ${JSON.stringify(event.data)}`)
  }
  console.log()
}

// ============================================
// 6. 병렬 vs 순차 처리
// ============================================

console.log('=== 6. 병렬 vs 순차 처리 ===\n')

async function* sequentialFetch(urls) {
  for (const url of urls) {
    await new Promise(resolve => setTimeout(resolve, 100))
    yield { url, status: 'ok' }
  }
}

async function test6() {
  const urls = ['url1', 'url2', 'url3', 'url4']

  // 순차 처리 (for await...of)
  console.log('순차 처리:')
  const startSeq = Date.now()
  for await (const result of sequentialFetch(urls)) {
    console.log(`  ${result.url}: ${result.status}`)
  }
  console.log(`  소요 시간: ${Date.now() - startSeq}ms`)
  console.log()

  // 병렬 처리 (Promise.all)
  console.log('병렬 처리:')
  const startPar = Date.now()
  const promises = urls.map(async url => {
    await new Promise(resolve => setTimeout(resolve, 100))
    return { url, status: 'ok' }
  })
  const results = await Promise.all(promises)
  for (const result of results) {
    console.log(`  ${result.url}: ${result.status}`)
  }
  console.log(`  소요 시간: ${Date.now() - startPar}ms`)
}

// ============================================
// 메인 실행
// ============================================

async function main() {
  await test1()
  await test2()
  await test3()
  await test4()
  await test5()
  await test6()

  console.log('\n=== 비동기 반복자 테스트 완료 ===')
}

main().catch(console.error)
