# NestJS 의존성 주입(Dependency Injection) 딥다이브

**개요:** TS Backend Meetup 발표 자료와 관련 기술 아티클을 참고하여, NestJS 실제 코드를 기반으로 DI 동작 원리를 정리한 문서입니다.

---

## 📌 TL;DR (핵심 요약)

**NestJS DI의 3단계:**
1. **메타데이터 기록**: TypeScript 데코레이터가 의존성 정보를 런타임에 기록
2. **그래프 구성**: `NestFactory.create()` 시점에 모듈과 프로바이더 의존성 트리 구축
3. **인스턴스 생성**: Injector가 의존성 그래프를 순회하며 하위부터 자동 인스턴스화

**핵심 개념:** IoC 컨테이너, 토큰, InstanceWrapper, Injector

---

## 📖 목차

1. [큰 그림: Manual Wiring → IoC Container](#1-큰-그림-manual-wiring--ioc-container)
2. [3단계 DI 파이프라인](#2-3단계-di-파이프라인)
3. [1단계: 메타데이터 기록](#3-1단계-무엇이-필요한지-메타데이터로-기록)
4. [2단계: 모듈/프로바이더 그래프 구성](#4-2단계-모듈프로바이더-그래프를-컨테이너에-등록)
5. [3단계: 인스턴스 생성과 주입](#5-3단계-실제-인스턴스-생성과-주입-injector)
6. [전체 흐름 요약](#6-전체-흐름-요약)
7. [토론 주제 딥다이브](#7-토론-주제-딥다이브)
8. [용어 정의](#8-용어-정의-glossary)
9. [실습 예제](#9-실습-예제)
10. [Common Pitfalls](#10-common-pitfalls-자주-하는-실수)

---

## 1. 큰 그림: Manual Wiring → IoC Container

### 1.1 Manual Wiring이란?

우리가 책에서 실습한 방식은 "조립을 사람이 한다"에 가깝습니다.

```js
// Manual Wiring: 개발자가 직접 의존성을 조립
const db = createDb("data.sqlite");
const blog = new Blog(db);  // 의존성을 직접 주입
```

**Manual Wiring의 특징:**
* 의존성 그래프를 **개발자가 머릿속으로 유지**
* new 순서/주입 순서를 **직접 관리**
* 규모가 커질수록 조립 코드가 비대해짐
* 의존성 변경 시 모든 조립 코드를 수동으로 수정해야 함

### 1.2 NestJS DI란?

NestJS는 위 조립을 **IoC 컨테이너가 자동 수행**합니다.
개발자는 "무엇이 필요한가(토큰/타입)"만 선언합니다.

```ts
// NestJS DI: 프레임워크가 자동으로 의존성 주입
@Injectable()
export class BlogService {
  constructor(private readonly db: DatabaseService) {}

  async getPosts() {
    return this.db.query('SELECT * FROM posts');
  }
}
```

**NestJS DI의 동작:**
* "db가 필요한데 → 타입은 DatabaseService네 → 그 인스턴스를 찾아/만들어 주입"
* 이 자동조립이 가능한 이유는 **메타데이터 기록 + 컨테이너 주입 엔진** 덕분
* 의존성이 추가되어도 생성자 파라미터만 추가하면 됨
* 테스트 시 Mock 객체로 쉽게 대체 가능

---

## 2. 3단계 DI 파이프라인

NestJS DI는 크게 다음 **3단계**로 나뉩니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS DI 파이프라인                          │
└─────────────────────────────────────────────────────────────────┘

  [1단계] 메타데이터 기록 (컴파일/로딩 시점)
  ─────────────────────────────────────────────
    @Injectable()          design:paramtypes
    @Inject(TOKEN)    →    self:paramtypes     → 메타데이터 저장

    결과: "이 클래스는 무엇이 필요한가" 정보 기록


  [2단계] 그래프 구성 (NestFactory.create 시점)
  ─────────────────────────────────────────────
    scanForModules()       모듈 트리 구축
    reflectImports()  →    의존성 관계 분석   → NestContainer
    reflectProviders()     InstanceWrapper 생성

    결과: "누가 누구에게 의존하는가" 그래프 완성


  [3단계] 인스턴스 생성 (createInstancesOfDependencies)
  ─────────────────────────────────────────────
    loadInstance()         의존성 먼저 준비
    resolveConstructorParams() → 파라미터 해결  → 실제 객체 생성
    instantiateClass()     new Provider(...)

    결과: 실제 사용 가능한 인스턴스 완성

```

**단계별 책임:**

1. **메타데이터 기록**: "내가 어떤 의존성이 필요한지" 선언
2. **그래프 구성**: "프로바이더 간 의존성 관계" 파악 및 구조화
3. **인스턴스 생성**: "실제로 인스턴스를 만들고" 주입

이 3단계가 각각 **어떤 실제 코드에서 수행되는지**를 따라가보면 Nest의 DI 전체가 보입니다.

---

## 3. 1단계: “무엇이 필요한지” 메타데이터로 기록

### 3.1 TS가 자동으로 남겨주는 메타데이터

TypeScript는 데코레이터가 켜진 상태(`emitDecoratorMetadata`)에서 다음 정보를 런타임에 남깁니다.

* `design:paramtypes` : 생성자 파라미터 타입 배열
* `design:type` : 프로퍼티 타입
* `design:returntype` : 반환 타입

Nest는 특히 `design:paramtypes`를 통해
**“생성자가 원하는 토큰 목록”**을 알아냅니다.

### 3.2 `@Inject()`가 하는 일: self:paramtypes 기록

자동 타입 추론만으로 부족할 때는 `@Inject(token)`으로 **직접 토큰을 지정**합니다.

* `@Inject()`는 **self:paramtypes** 라는 별도 메타데이터에
  * “몇 번째 파라미터에 어떤 토큰을 넣어야 하는지”를 기록
* 생성자 파라미터 “순서”가 중요하기 때문에 index와 함께 저장

결국 Nest는 **design:paramtypes + self:paramtypes**를 합쳐
“이 클래스가 최종적으로 원하는 의존성 토큰 목록”을 계산합니다.

---

## 4. 2단계: 모듈/프로바이더 그래프를 컨테이너에 등록

이 단계가 시작되는 곳은 **NestFactory.create()**입니다.

### 4.1 부팅 진입점: NestFactory.create 내부

`NestFactory.create`는 내부에서 다음을 호출합니다.

* `dependenciesScanner.scan(...)`
* `instanceLoader.createInstancesOfDependencies(...)`

즉,

* **scan 단계**에서  
  1. 모듈 등록
  2. 모듈 의존 트리 구성
  3. 프로바이더 wrapper 생성

* **createInstancesOfDependencies 단계**에서  
  4) 실제 인스턴스화 및 주입

### 4.2 scanForModules: 모듈 등록(DFS)

* `MODULE_METADATA.IMPORTS`(=imports 메타데이터)를 읽고
* imports를 따라 **DFS 재귀 순회**
* 결과: **모든 모듈이 NestContainer에 등록**

즉 `@Module({ imports: [...] })`는
런타임 메타데이터로 남고, 스캐너가 이걸 트리로 만듭니다.

### 4.3 reflectImports / reflectProviders

scanModulesForDependencies 단계에서 모듈을 다시 순회하며

* `reflectImports`
  → imports 메타데이터를 Module 인스턴스에 붙여
  **“모듈 의존 트리”** 완성

* `reflectProviders`
  → providers 메타데이터를 읽어
  **각 프로바이더를 InstanceWrapper로 감싸 등록**

### 4.4 InstanceWrapper: “인스턴스 + 메타데이터” 래퍼

* wrapper는 처음엔 `instance = null`
* 인스턴스가 만들어지는 과정에서 채워짐
* 여기엔
  * token
  * scope
  * durable 여부
  * enhancer/alias 여부
    같은 DI 실행에 필요한 정보가 함께 저장됨

실제 구현도 “token/host/scope/instance 등을 관리하는 래퍼”로 설계돼 있습니다. ([GitHub][2])

---

## 5. 3단계: 실제 인스턴스 생성과 주입 (Injector)

이 부분의 핵심 클래스가 **Injector**입니다. ([GitHub][3])

### 5.1 인스턴스 생성 알고리즘(요약)

흐름을 코드 관점으로 보면:

1. 모든 provider wrapper에 대해 로딩 시작
2. 각 provider는 **자신의 의존성 토큰 목록**을 구함
3. **현재 모듈 → imports 모듈 순서**로 토큰 탐색
4. 하위 의존성부터 먼저 인스턴스화
5. 모든 의존성이 준비되면 `new`로 자신을 생성
6. 프로퍼티 주입까지 마치면 완료

### 5.2 `loadInstance` → `resolveConstructorParams` → `instantiateClass`

실제 Injector의 주요 호출 루트이자 DI의 핵심 경로입니다. ([GitHub][3])

* `loadInstance(...)`
  “이 provider를 만들려면 먼저 의존성을 해결해야겠다”

* `resolveConstructorParams(...)`
  1단계에서 기록해둔
  * `design:paramtypes`
  * `self:paramtypes(@Inject)`
    를 합쳐 **의존성 토큰 목록을 완성**하고
    각 토큰의 인스턴스를 재귀적으로 준비

* `instantiateClass(...)`
  준비된 인스턴스 배열을 펼쳐
  **`new Provider(...instances)`** 수행
  → 결국 Manual Wiring의 `new A(b,c)`를 프레임워크가 대신함. ([GitHub][3])

---

## 6. 전체 흐름 요약

지금까지의 1→2→3단계를 정리하면 다음과 같습니다.

* (초기상태) 모듈/프로바이더/컨트롤러가 선언돼 있고
* (메타데이터 설정) TS+@Inject로 필요한 토큰이 기록되고
* (모듈 등록) 컨테이너가 DFS로 모듈을 수집하고
* (트리 구성) imports/providers가 wrapper에 반영되고
* (의존 인스턴스 생성) 하위부터 차례로 준비한 다음
* (끝) 최상위 컨트롤러까지 인스턴스화 완료

이 흐름을 **NestJS 내부 코드 루트에 그대로 매핑**해서 이해하는 것이 중요합니다.

---

## 7. 토론 주제 딥다이브

### 7.1 순환 의존성에서 `forwardRef()`가 필요한 이유

Manual Wiring은 조립 순서가 코드에 드러나서 즉시 막힙니다.

Nest는

* 스캔 시점에 그래프를 만들고
* 인스턴스화는 그 이후에 수행하기 때문에

“A가 B를 참조한다는 사실”은 알지만
**그 즉시 B의 실체를 확정할 수 없는 구간**이 생깁니다.
그래서 “나중에 이 토큰을 다시 해석해줘”라는 지연 참조가 필요하고
그 기법이 `forwardRef()`입니다. ([GitHub][3])

### 7.2 REQUEST 스코프의 성능 영향

기본 싱글톤은

* 그래프 resolve + 인스턴스 생성이 **1회**

REQUEST 스코프는

* 요청마다 DI 서브트리를 새로 만들고
* 하위 의존성까지 연쇄적으로 재생성될 수 있어
  **resolve 비용 + GC 비용이 요청마다 반복**

즉 “요청 단위 상태가 꼭 필요한 경우에만” 쓰는 게 합리적입니다.
(scope 정보는 InstanceWrapper에서 관리) ([GitHub][2])

---

## 8. 용어 정의 (Glossary)

**IoC (Inversion of Control)**: 프레임워크가 객체 생성/관리를 담당하는 설계 원칙. DI는 IoC의 구현 패턴.

**DI (Dependency Injection)**: 객체가 필요한 의존성을 외부에서 주입받는 패턴. NestJS는 주로 생성자 주입 사용.

**토큰 (Token)**: 의존성을 식별하는 고유 키. 클래스 타입, 문자열, Symbol 사용 가능.

**프로바이더 (Provider)**: `@Injectable()` 데코레이터로 표시된 DI 컨테이너 등록 가능 객체.

**InstanceWrapper**: NestJS 내부에서 프로바이더를 감싸는 래퍼. 토큰, 스코프, 인스턴스 등 메타데이터 관리.

**Injector**: 의존성 해결과 인스턴스 생성을 담당하는 핵심 클래스. 그래프를 순회하며 하위부터 인스턴스화.

**NestContainer**: 모든 모듈과 프로바이더를 관리하는 전역 컨테이너. 싱글톤 인스턴스 저장.

**design:paramtypes**: TypeScript 컴파일러가 생성하는 메타데이터. 생성자 파라미터 타입 정보 배열.

**self:paramtypes**: `@Inject()` 데코레이터가 생성하는 메타데이터. 타입 추론 불가능 시 사용.

**DEFAULT (Singleton)**: 앱 전체에서 단일 인스턴스 (기본값). 최고 성능.

**REQUEST**: HTTP 요청마다 새 인스턴스. 요청별 컨텍스트 저장 가능, 성능 오버헤드 있음.

**TRANSIENT**: 주입마다 새 인스턴스. 완전 격리, 최대 메모리/성능 비용.

---

## 9. 실습 예제

### 9.1 기본 DI 실습

간단한 블로그 애플리케이션으로 NestJS DI를 실습해보겠습니다.

```ts
// database.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  private posts = [
    { id: 1, title: 'First Post', content: 'Hello World' },
    { id: 2, title: 'Second Post', content: 'NestJS is awesome' }
  ];

  findAll() {
    return this.posts;
  }

  findById(id: number) {
    return this.posts.find(post => post.id === id);
  }
}

// blog.service.ts
import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class BlogService {
  constructor(private readonly db: DatabaseService) {}

  getAllPosts() {
    return this.db.findAll();
  }

  getPost(id: number) {
    const post = this.db.findById(id);
    if (!post) throw new Error(`Post ${id} not found`);
    return post;
  }
}

// blog.module.ts
import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { DatabaseService } from './database.service';

@Module({
  providers: [DatabaseService, BlogService],
  exports: [BlogService]
})
export class BlogModule {}
```

### 9.2 순환 의존성 해결 실습

```ts
// user.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { PostService } from './post.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => PostService))
    private readonly postService: PostService
  ) {}

  getUserPosts(userId: number) {
    return this.postService.findByUserId(userId);
  }
}

// post.service.ts
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { UserService } from './user.service';

@Injectable()
export class PostService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService
  ) {}

  findByUserId(userId: number) {
    const user = this.userService.findById(userId);
    return this.posts.filter(post => post.userId === userId);
  }
}

@Module({
  providers: [UserService, PostService]
})
export class AppModule {}
```

---

## 10. Common Pitfalls (자주 하는 실수)

### 10.1 순환 의존성을 forwardRef 없이 사용

**문제:**
```ts
@Injectable()
export class ServiceA {
  constructor(private readonly serviceB: ServiceB) {}
}

@Injectable()
export class ServiceB {
  constructor(private readonly serviceA: ServiceA) {}
}
// ❌ Error: Nest can't resolve dependencies of the ServiceA (?)
```

**해결:**
```ts
@Injectable()
export class ServiceA {
  constructor(
    @Inject(forwardRef(() => ServiceB))
    private readonly serviceB: ServiceB
  ) {}
}

@Injectable()
export class ServiceB {
  constructor(
    @Inject(forwardRef(() => ServiceA))
    private readonly serviceA: ServiceA
  ) {}
}
// ✅ 정상 동작
```

**원칙:** 순환 의존성은 가능하면 피하되, 불가피한 경우 `forwardRef()` 사용

### 10.2 인터페이스를 토큰으로 사용

**문제:**
```ts
interface IUserService {
  findUser(id: number): User;
}

@Injectable()
export class AppService {
  // ❌ 인터페이스는 런타임에 존재하지 않아 주입 불가
  constructor(private readonly userService: IUserService) {}
}
```

**해결:**
```ts
// 1. 추상 클래스 사용 (권장)
abstract class IUserService {
  abstract findUser(id: number): User;
}

@Injectable()
export class UserService implements IUserService {
  findUser(id: number): User { /* ... */ }
}

@Injectable()
export class AppService {
  constructor(private readonly userService: IUserService) {}
}

@Module({
  providers: [
    { provide: IUserService, useClass: UserService }
  ]
})

// 2. 문자열/Symbol 토큰 사용
const USER_SERVICE = Symbol('USER_SERVICE');

@Injectable()
export class AppService {
  constructor(
    @Inject(USER_SERVICE)
    private readonly userService: IUserService
  ) {}
}
```

### 10.3 @Injectable() 데코레이터 누락

**문제:**
```ts
// ❌ @Injectable() 없음
export class DatabaseService {
  query() { /* ... */ }
}

@Injectable()
export class AppService {
  constructor(private readonly db: DatabaseService) {}
}
// Error: Nest can't resolve dependencies
```

**해결:**
```ts
@Injectable()  // ✅ 반드시 추가
export class DatabaseService {
  query() { /* ... */ }
}
```

**원칙:** DI 컨테이너에서 관리할 모든 클래스에 `@Injectable()` 필수

### 10.4 모듈에 프로바이더 등록 누락

**문제:**
```ts
@Injectable()
export class UserService { /* ... */ }

@Module({
  providers: [AppService]  // ❌ UserService 등록 안 됨
})
export class AppModule {}

@Injectable()
export class AppService {
  constructor(private readonly userService: UserService) {}
}
// Error: Nest can't resolve dependencies of the AppService (?)
```

**해결:**
```ts
@Module({
  providers: [
    AppService,
    UserService  // ✅ 추가
  ]
})
export class AppModule {}
```

---

## 11. 결론

NestJS DI는 개발자가 수동으로 수행하던 의존성 조립을 프레임워크가 자동화한 시스템입니다.

**핵심 메커니즘:**
1. **메타데이터 기록**: TypeScript 데코레이터로 의존성 정보를 런타임에 기록
2. **그래프 구성**: NestContainer가 모듈과 프로바이더 간 의존성 관계를 분석
3. **자동 인스턴스화**: Injector가 의존성 그래프를 순회하며 하위부터 객체 생성

**실무 권장사항:**
- 대부분의 경우 싱글톤 스코프 사용
- 순환 의존성은 가능하면 피하되, 불가피한 경우 `forwardRef()` 사용
- 인터페이스 대신 추상 클래스나 커스텀 토큰 사용
- REQUEST 스코프는 요청별 컨텍스트가 필요한 경우에만 사용

**학습 로드맵:** 기본(`@Injectable()`, 생성자 주입) → 중급(커스텀 토큰, 스코프) → 고급(`forwardRef()`, 동적 모듈)

---

## 12. 참고 자료

### 공식 문서
* **[NestJS 공식 문서 - Fundamentals: Custom providers](https://docs.nestjs.com/fundamentals/custom-providers)**
* **[NestJS 공식 문서 - Fundamentals: Injection scopes](https://docs.nestjs.com/fundamentals/injection-scopes)**
* **[NestJS 공식 문서 - Fundamentals: Circular dependency](https://docs.nestjs.com/fundamentals/circular-dependency)**

### 발표 자료 및 아티클
* **[TS Backend Meetup — "NestJS 의존성 주입 딥다이브" (Session3)](https://github.com/ts-backend-meetup-ts/meetup/blob/main/public/2507/session3.pdf)** - 본 문서의 기반이 된 발표 자료
* **[coalery, "Nest.js는 실제로 어떻게 의존성을 주입해줄까?"](https://velog.io/@coalery/nest-injection-how)** - NestJS DI 내부 동작 분석 아티클

### NestJS Core 소스 코드
* **[Injector](https://github.com/nestjs/nest/blob/master/packages/core/injector/injector.ts)** - 의존성 해결과 인스턴스 생성을 담당하는 핵심 클래스
* **[InstanceWrapper](https://github.com/nestjs/nest/blob/master/packages/core/injector/instance-wrapper.ts)** - 프로바이더 메타데이터 관리 래퍼
* **[Module](https://github.com/nestjs/nest/blob/master/packages/core/injector/module.ts)** - 모듈 클래스, Provider 등록/exports 검증 담당
* **[DependenciesScanner](https://github.com/nestjs/nest/blob/master/packages/core/scanner.ts)** - 모듈 스캔 및 의존성 그래프 구성

[1]: https://velog.io/@coalery/nest-injection-how "Nest.js는 실제로 어떻게 의존성을 주입해줄까? - 벨로그"
[2]: https://github.com/nestjs/nest/blob/8f3d51f8d50e0edaaa85ea036172da0c6b3792dc/packages/core/injector/instance-wrapper.ts#L61 "nest/packages/core/injector/instance-wrapper.ts at master · nestjs/nest · GitHub"
[3]: https://github.com/nestjs/nest/blob/8f3d51f8d50e0edaaa85ea036172da0c6b3792dc/packages/core/injector/injector.ts#L86 "nest/packages/core/injector/injector.ts at master · nestjs/nest · GitHub"
