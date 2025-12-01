/**
 * Chapter 8: 구조적 설계 패턴 - 연습문제
 * 8.1 HTTP 클라이언트 캐시
 *
 * HTTP 요청의 응답을 캐시하는 프록시를 작성합니다.
 * 동일한 요청을 다시 수행하면 서버에 요청하는 대신
 * 로컬 캐시에서 즉시 반환합니다.
 */

/**
 * HTTP 클라이언트에 캐싱 기능을 추가하는 프록시
 * @param {Object} httpClient - 원본 HTTP 클라이언트 (fetch 또는 유사한 API)
 * @param {Object} options - 캐시 옵션
 * @param {number} options.ttl - 캐시 유효 시간 (밀리초)
 * @param {number} options.maxSize - 최대 캐시 항목 수
 * @returns {Proxy} 캐싱이 추가된 프록시 HTTP 클라이언트
 */
export function createCachingHttpClient(httpClient, options = {}) {
  const { ttl = 60000, maxSize = 100 } = options

  // 캐시 저장소
  const cache = new Map()

  // 캐시 키 생성
  function getCacheKey(url, options = {}) {
    const method = options.method || 'GET'
    // GET 요청만 캐싱
    if (method !== 'GET') return null
    return `${method}:${url}`
  }

  // 캐시 항목 정리 (TTL 만료 및 최대 크기 초과)
  function cleanCache() {
    const now = Date.now()
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key)
      }
    }
    // 최대 크기 초과 시 가장 오래된 항목 삭제
    while (cache.size > maxSize) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
  }

  // 캐싱 프록시 생성
  return new Proxy(httpClient, {
    apply(target, thisArg, argumentsList) {
      const [url, options = {}] = argumentsList
      const cacheKey = getCacheKey(url, options)

      // GET 요청이 아니면 캐싱하지 않음
      if (!cacheKey) {
        return Reflect.apply(target, thisArg, argumentsList)
      }

      // 캐시에서 확인
      const cachedEntry = cache.get(cacheKey)
      if (cachedEntry && Date.now() - cachedEntry.timestamp < ttl) {
        console.log(`[Cache HIT] ${url}`)
        // 캐시된 응답을 Promise로 반환
        return Promise.resolve(cachedEntry.response.clone())
      }

      console.log(`[Cache MISS] ${url}`)
      cleanCache()

      // 원본 요청 실행 후 캐싱
      return Reflect.apply(target, thisArg, argumentsList)
        .then(response => {
          // 성공 응답만 캐싱
          if (response.ok) {
            cache.set(cacheKey, {
              response: response.clone(),
              timestamp: Date.now()
            })
          }
          return response
        })
    }
  })
}

/**
 * 간단한 메모리 캐싱 HTTP 클라이언트 (fetch 없이 사용 가능)
 */
export class CachingHttpClient {
  constructor(options = {}) {
    this.ttl = options.ttl || 60000
    this.maxSize = options.maxSize || 100
    this.cache = new Map()
  }

  getCacheKey(url, method = 'GET') {
    if (method !== 'GET') return null
    return `${method}:${url}`
  }

  cleanCache() {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }
  }

  async get(url) {
    const cacheKey = this.getCacheKey(url)

    // 캐시 확인
    const cachedEntry = this.cache.get(cacheKey)
    if (cachedEntry && Date.now() - cachedEntry.timestamp < this.ttl) {
      console.log(`[Cache HIT] ${url}`)
      return { ...cachedEntry.data, fromCache: true }
    }

    console.log(`[Cache MISS] ${url}`)
    this.cleanCache()

    // 실제 요청 시뮬레이션
    const response = await this.fetchSimulated(url)

    // 캐싱
    this.cache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    })

    return { ...response, fromCache: false }
  }

  // 실제 HTTP 요청 시뮬레이션
  async fetchSimulated(url) {
    // 네트워크 지연 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 100))
    return {
      url,
      status: 200,
      data: { message: `Response from ${url}`, timestamp: Date.now() }
    }
  }

  // 캐시 통계
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    }
  }

  // 캐시 초기화
  clearCache() {
    this.cache.clear()
  }
}

// 테스트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('=== HTTP 클라이언트 캐시 프록시 테스트 ===\n')

  const client = new CachingHttpClient({ ttl: 5000 })  // 5초 TTL

  async function runTest() {
    // 첫 번째 요청 - 캐시 미스
    console.log('--- 첫 번째 요청 ---')
    const res1 = await client.get('https://api.example.com/users')
    console.log('결과:', res1.fromCache ? '캐시에서' : '서버에서')
    console.log()

    // 두 번째 요청 (동일 URL) - 캐시 히트
    console.log('--- 두 번째 요청 (동일 URL) ---')
    const res2 = await client.get('https://api.example.com/users')
    console.log('결과:', res2.fromCache ? '캐시에서' : '서버에서')
    console.log()

    // 다른 URL 요청 - 캐시 미스
    console.log('--- 다른 URL 요청 ---')
    const res3 = await client.get('https://api.example.com/posts')
    console.log('결과:', res3.fromCache ? '캐시에서' : '서버에서')
    console.log()

    // 캐시 통계
    console.log('--- 캐시 통계 ---')
    console.log(client.getStats())

    // TTL 만료 테스트
    console.log('\n--- TTL 만료 테스트 (6초 대기) ---')
    await new Promise(resolve => setTimeout(resolve, 6000))

    const res4 = await client.get('https://api.example.com/users')
    console.log('결과:', res4.fromCache ? '캐시에서' : '서버에서 (TTL 만료)')
  }

  runTest()
}
