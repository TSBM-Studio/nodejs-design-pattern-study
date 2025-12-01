/**
 * 07-middleware-express-style.js
 * Express 스타일 미들웨어
 *
 * 콜백 기반의 Express 스타일 미들웨어 패턴을 구현합니다.
 * next() 콜백으로 다음 미들웨어를 호출하는 방식입니다.
 */

// ============================================
// 미들웨어 관리자
// ============================================

class ExpressStyleMiddleware {
  constructor() {
    this.middlewares = []
  }

  /**
   * 미들웨어 등록
   */
  use(middleware) {
    this.middlewares.push(middleware)
    return this
  }

  /**
   * 미들웨어 체인 실행
   * @param {Object} context - 미들웨어 간 공유되는 컨텍스트
   * @param {Function} callback - 완료 시 호출되는 콜백
   */
  run(context, callback) {
    let index = 0
    const middlewares = this.middlewares

    function next(err) {
      // 에러가 있으면 즉시 콜백 호출
      if (err) {
        return callback(err)
      }

      // 모든 미들웨어 실행 완료
      if (index >= middlewares.length) {
        return callback(null)
      }

      // 현재 미들웨어 가져오기
      const middleware = middlewares[index++]

      try {
        // 미들웨어 실행
        middleware(context, next)
      } catch (e) {
        callback(e)
      }
    }

    // 첫 번째 미들웨어 실행
    next()
  }
}

// ============================================
// 미들웨어 정의
// ============================================

// 로깅 미들웨어
function loggingMiddleware(ctx, next) {
  console.log(`[LOG] 요청 시작: ${ctx.path}`)
  ctx.startTime = Date.now()
  next()
}

// 인증 미들웨어
function authMiddleware(ctx, next) {
  if (!ctx.headers?.authorization) {
    console.log('[AUTH] 인증 토큰 없음 - 익명 사용자')
    ctx.user = { name: 'anonymous', role: 'guest' }
  } else {
    console.log('[AUTH] 인증 토큰 확인됨')
    ctx.user = { name: 'john', role: 'admin' }
  }
  next()
}

// 권한 검사 미들웨어
function permissionMiddleware(ctx, next) {
  if (ctx.requiredRole && ctx.user.role !== ctx.requiredRole) {
    return next(new Error(`권한 없음: ${ctx.requiredRole} 필요`))
  }
  console.log(`[PERM] 권한 확인: ${ctx.user.role}`)
  next()
}

// 데이터 처리 미들웨어
function dataMiddleware(ctx, next) {
  console.log('[DATA] 데이터 처리 중...')
  ctx.data = {
    message: `Hello, ${ctx.user.name}!`,
    timestamp: new Date().toISOString()
  }
  next()
}

// 응답 미들웨어
function responseMiddleware(ctx, next) {
  const duration = Date.now() - ctx.startTime
  console.log(`[RESP] 응답 생성 (${duration}ms)`)
  ctx.response = {
    status: 200,
    body: ctx.data
  }
  next()
}

// ============================================
// 테스트
// ============================================

function main() {
  console.log('=== Express 스타일 미들웨어 ===\n')

  const app = new ExpressStyleMiddleware()

  // 미들웨어 등록
  app
    .use(loggingMiddleware)
    .use(authMiddleware)
    .use(permissionMiddleware)
    .use(dataMiddleware)
    .use(responseMiddleware)

  // 테스트 1: 인증된 요청
  console.log('--- 테스트 1: 인증된 요청 ---')
  const ctx1 = {
    path: '/api/data',
    headers: { authorization: 'Bearer token123' }
  }

  app.run(ctx1, (err) => {
    if (err) {
      console.log(`에러: ${err.message}`)
    } else {
      console.log('응답:', ctx1.response)
    }
    console.log()

    // 테스트 2: 인증되지 않은 요청
    console.log('--- 테스트 2: 인증되지 않은 요청 ---')
    const ctx2 = {
      path: '/api/public'
    }

    app.run(ctx2, (err) => {
      if (err) {
        console.log(`에러: ${err.message}`)
      } else {
        console.log('응답:', ctx2.response)
      }
      console.log()

      // 테스트 3: 권한 필요한 요청 (실패 케이스)
      console.log('--- 테스트 3: 권한 부족 ---')
      const ctx3 = {
        path: '/api/admin',
        requiredRole: 'admin'
        // 인증 토큰 없음 → guest 역할
      }

      app.run(ctx3, (err) => {
        if (err) {
          console.log(`에러: ${err.message}`)
        } else {
          console.log('응답:', ctx3.response)
        }
        console.log()

        // 테스트 4: 권한 있는 요청
        console.log('--- 테스트 4: 권한 충분 ---')
        const ctx4 = {
          path: '/api/admin',
          headers: { authorization: 'Bearer admin-token' },
          requiredRole: 'admin'
        }

        app.run(ctx4, (err) => {
          if (err) {
            console.log(`에러: ${err.message}`)
          } else {
            console.log('응답:', ctx4.response)
          }

          console.log('\n=== Express 스타일 미들웨어 테스트 완료 ===')
        })
      })
    })
  })
}

main()
