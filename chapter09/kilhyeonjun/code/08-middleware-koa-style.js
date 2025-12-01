/**
 * 08-middleware-koa-style.js
 * Koa 스타일 미들웨어 (async/await)
 *
 * Promise와 async/await를 활용한 Koa 스타일 미들웨어를 구현합니다.
 * "양파 껍질" 구조로 요청/응답 흐름을 처리합니다.
 */

// ============================================
// 미들웨어 관리자
// ============================================

class KoaStyleMiddleware {
  constructor() {
    this.middlewares = []
  }

  /**
   * 미들웨어 등록
   * @param {Function} middleware - async (ctx, next) => { ... }
   */
  use(middleware) {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * 미들웨어 체인 실행
   * @param {Object} context - 미들웨어 간 공유되는 컨텍스트
   */
  async run(context) {
    // compose: 미들웨어들을 하나의 함수로 합성
    const dispatch = (index) => {
      if (index >= this.middlewares.length) {
        return Promise.resolve()
      }

      const middleware = this.middlewares[index]

      return Promise.resolve(
        middleware(context, () => dispatch(index + 1))
      )
    }

    return dispatch(0)
  }
}

// ============================================
// 미들웨어 정의
// ============================================

// 로깅 미들웨어 (요청/응답 양쪽 처리)
async function loggingMiddleware(ctx, next) {
  console.log(`[LOG] ▶ 요청 시작: ${ctx.path}`)
  ctx.startTime = Date.now()

  await next()  // 다음 미들웨어 실행 대기

  const duration = Date.now() - ctx.startTime
  console.log(`[LOG] ◀ 요청 완료: ${ctx.path} (${duration}ms)`)
}

// 에러 핸들링 미들웨어
async function errorMiddleware(ctx, next) {
  try {
    await next()
  } catch (err) {
    console.log(`[ERROR] 에러 캐치: ${err.message}`)
    ctx.response = {
      status: err.status || 500,
      body: { error: err.message }
    }
  }
}

// 인증 미들웨어
async function authMiddleware(ctx, next) {
  console.log('[AUTH] 인증 확인 중...')

  // 비동기 인증 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 50))

  if (!ctx.headers?.authorization) {
    ctx.user = { name: 'anonymous', role: 'guest' }
  } else {
    ctx.user = { name: 'john', role: 'admin' }
  }

  console.log(`[AUTH] 사용자: ${ctx.user.name} (${ctx.user.role})`)
  await next()
}

// 데이터 처리 미들웨어
async function dataMiddleware(ctx, next) {
  console.log('[DATA] 데이터 로딩 중...')

  // 비동기 데이터 로딩 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 100))

  ctx.data = {
    items: ['item1', 'item2', 'item3'],
    user: ctx.user.name
  }

  console.log('[DATA] 데이터 로딩 완료')
  await next()
}

// 응답 생성 미들웨어
async function responseMiddleware(ctx, next) {
  await next()

  // next() 이후에 실행 → 응답 단계
  if (!ctx.response) {
    ctx.response = {
      status: 200,
      body: ctx.data
    }
  }
  console.log('[RESP] 응답 생성 완료')
}

// ============================================
// 테스트
// ============================================

async function main() {
  console.log('=== Koa 스타일 미들웨어 ===\n')

  const app = new KoaStyleMiddleware()

  // 미들웨어 등록 (양파 껍질 순서)
  app
    .use(loggingMiddleware)     // 바깥쪽 - 시간 측정
    .use(errorMiddleware)       // 에러 처리
    .use(authMiddleware)        // 인증
    .use(dataMiddleware)        // 데이터 로딩
    .use(responseMiddleware)    // 응답 생성

  // 테스트 1: 정상 요청
  console.log('--- 테스트 1: 정상 요청 ---')
  const ctx1 = {
    path: '/api/data',
    headers: { authorization: 'Bearer token' }
  }

  await app.run(ctx1)
  console.log('최종 응답:', ctx1.response)
  console.log()

  // 테스트 2: 인증 없는 요청
  console.log('--- 테스트 2: 인증 없는 요청 ---')
  const ctx2 = {
    path: '/api/public'
  }

  await app.run(ctx2)
  console.log('최종 응답:', ctx2.response)
  console.log()

  // 테스트 3: 에러 발생 케이스
  console.log('--- 테스트 3: 에러 발생 ---')

  const appWithError = new KoaStyleMiddleware()
  appWithError
    .use(loggingMiddleware)
    .use(errorMiddleware)
    .use(async (ctx, next) => {
      if (ctx.forceError) {
        const error = new Error('강제 에러 발생!')
        error.status = 400
        throw error
      }
      await next()
    })
    .use(responseMiddleware)

  const ctx3 = {
    path: '/api/error',
    forceError: true
  }

  await appWithError.run(ctx3)
  console.log('최종 응답:', ctx3.response)

  console.log('\n=== Koa 스타일 미들웨어 테스트 완료 ===')
}

main().catch(console.error)
