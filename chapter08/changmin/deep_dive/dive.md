# NestJS Deep Dive: GoF 패턴의 실제 적용

NestJS는 프레임워크 아키텍처 설계 단계에서 GoF 디자인 패턴을 적극적으로 채용함.
특히 **확장성(Extensibility)**과 **유지보수성(Maintainability)**을 위해 각 컴포넌트가 특정 패턴의 철학을 충실히 따르고 있음.

이 문서는 NestJS의 핵심 컴포넌트들이 어떤 GoF 패턴을 기반으로 설계되었는지 심층 분석함.

---

## 1. HttpAdapter와 Adapter Pattern

### 1.1 왜 Adapter Pattern인가?

**핵심 목표: 기반 HTTP 서버 기술(Express, Fastify)의 추상화**

GoF Adapter 패턴의 정의는 "호환되지 않는 인터페이스를 가진 클래스를, 클라이언트가 기대하는 인터페이스로 변환하는 것"임.
NestJS는 `Express`나 `Fastify`가 가진 고유의 API를 Nest가 정의한 `Unified Interface`로 변환함.

```text
[ Client (NestJS Core) ]
        |
        v
[ HttpAdapter Interface ] <--- (변환 계층)
        |
        v
[ Express / Fastify ]
```

### 1.2 실제 동작 방식

사용자가 `NestFactory.create()`를 호출할 때 내부적으로 Adapter가 주입됨.

```typescript
// 1. 사용자는 추상화된 인터페이스만 사용
const app = await NestFactory.create(AppModule);

// 2. 내부 동작 (IoC 컨테이너)
// ExpressAdapter 또는 FastifyAdapter가 생성되어 외부 엔진을 감쌈
const httpAdapter = new ExpressAdapter(expressInstance);
this.container.setHttpAdapter(httpAdapter);
```

### 1.3 Adapter 패턴 적용의 이점

- **DIP (의존성 역전) 달성**: Nest Core는 구체적인 Express/Fastify에 의존하지 않고 `HttpAdapter` 인터페이스에만 의존함.
- **서버 엔진 교체 용이**: 비즈니스 로직 수정 없이 `FastifyAdapter`로 교체만 하면 즉시 성능 튜닝 가능.
- **테스트 용이성**: `HttpAdapter`를 Mocking하여 단위 테스트 진행 가능.

---

## 2. ClientProxy와 Proxy Pattern

### 2.1 왜 Proxy Pattern인가?

**핵심 목표: 원격 서비스(Microservices)에 대한 접근 제어 및 대리 수행**

GoF Proxy 패턴의 정의는 "실제 객체에 대한 접근을 제어하기 위해 대리자(Proxy)를 두는 것"임.
NestJS의 `ClientProxy`는 Redis, Kafka, gRPC 등 실제 전송 계층(Transport Layer)을 숨기고, 마치 로컬 객체처럼 메시지를 보낼 수 있게 함.

### 2.2 ClientProxy의 역할 (대리자의 책임)

단순히 메시지를 전달하는 것이 아니라, **복잡한 통신 과정을 대행**함.

1.  **접근 제어/전처리**: 데이터를 직렬화(Serialize)하여 전송 가능한 형태로 변환.
2.  **연결 관리**: `connect()`, `close()` 등 실제 네트워크 연결 상태 관리 (Lazy Connection 지원).
3.  **비동기 제어**: 요청을 보내고 응답을 기다리는(Subscribe) 흐름 제어.

```typescript
// 사용자는 단순 호출 (내부 복잡성 몰라도 됨)
client.send("pattern", data);

// 실제 Proxy 내부 동작
// 1. Serialize (데이터 변환)
// 2. Transport Specific Encode (프로토콜에 맞게 포장)
// 3. Publish/Send (네트워크 전송)
// 4. Deserialize (응답 복원)
```

### 2.3 Adapter vs Proxy 차이점

| 구분          | HttpAdapter                 | ClientProxy                          |
| :------------ | :-------------------------- | :----------------------------------- |
| **패턴**      | Adapter Pattern             | Proxy Pattern                        |
| **주요 목적** | **인터페이스 호환** (변환)  | **접근 제어 및 대리** (위임)         |
| **대상**      | HTTP 서버 (Express/Fastify) | 원격 마이크로서비스 (Redis/Kafka 등) |

---

## 3. NestInterceptor와 Decorator Pattern

### 3.1 왜 Decorator Pattern인가?

**핵심 목표: 기존 로직을 수정하지 않고 부가 기능(횡단 관심사) 추가**

GoF Decorator 패턴의 정의는 "객체에 부가 기능을 동적으로 추가하고, 기존 객체를 감싸(Wrapping) 확장하는 것"임.
NestJS의 Interceptor는 AOP(관점 지향 프로그래밍) 스타일로 이 패턴을 구현함.

### 3.2 구조적 유사성

Interceptor는 요청 흐름(Stream)을 감싸는 래퍼(Wrapper) 역할을 수행함.

```typescript
intercept(context, next: CallHandler) {
  // 1. 전처리 (Before) - 로깅, 요청 변조
  console.log('Before...');

  // 2. 원본 핸들러 호출 및 결과 래핑 (Decoration)
  return next.handle().pipe(
    // 3. 후처리 (After) - 응답 변조, 캐싱, 에러 처리
    map(data => ({ data })),
  );
}
```

### 3.3 Decorator 패턴 적용의 이점

- **개방-폐쇄 원칙 (OCP)**: 기존 핸들러 코드를 전혀 건드리지 않고 로깅, 캐싱, 타임아웃 기능을 추가할 수 있음.
- **책임 분리**: 비즈니스 로직과 부가 기능(인프라 로직)을 완벽히 분리.
- **조합 가능성**: 여러 Interceptor를 체이닝하여 다양한 기능을 레고처럼 조립 가능.

---

## 4. 결론: NestJS 아키텍처 요약

NestJS는 GoF 패턴을 적재적소에 활용하여 프레임워크의 철학을 완성함.

| NestJS 컴포넌트 | 적용된 GoF 패턴 | 핵심 의도 (Intent)                                    |
| :-------------- | :-------------- | :---------------------------------------------------- |
| **HttpAdapter** | **Adapter**     | **호환성**: 어떤 서버 엔진이든 Nest 인터페이스로 변환 |
| **ClientProxy** | **Proxy**       | **제어**: 복잡한 원격 통신 과정을 대리자가 전담       |
| **Interceptor** | **Decorator**   | **확장**: 기존 로직 수정 없이 부가 기능 덧붙이기      |

> **Insight**
>
> NestJS를 잘 쓴다는 것은, 단순히 기능을 구현하는 것이 아니라
> 프레임워크가 제공하는 **"패턴의 의도"**에 맞게 코드를 배치하는 것임.
>
> - 외부 라이브러리를 연결할 땐 -> **Adapter**
> - 복잡한 리소스 접근을 숨길 땐 -> **Proxy**
> - 횡단 관심사를 추가할 땐 -> **Decorator (Interceptor)**
