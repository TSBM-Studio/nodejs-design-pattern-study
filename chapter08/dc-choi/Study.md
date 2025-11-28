# Proxy의 느린 초기화는 자주 쓰일거같은데 어디에 쓰일까?

## Virtual Proxy 패턴 (ORM에서 많이 쓰는 lazy-loading)
mikro-orm 같은 ORM에서 연관된 entity를 lazy-load할 때 사용.

[참고1](https://mikro-orm.io/docs/defining-entities#scalarreference-wrapper)

[참고2](https://mikro-orm.io/docs/entity-manager#entity-references)

[참고3](https://mikro-orm.io/docs/type-safe-relations)

참고로 Prisma는 lazy-loading을 지원하지 않음.

## DI Container에서 Lazy Singleton
기본 provider는 eager singleton (앱 시작 시 인스턴스 생성)

대신 LazyModuleLoader로 모듈을 lazy-load해서, 결과적으로 그 모듈 안 provider들을 늦게 띄우는 건 가능

[참고](https://docs.nestjs.com/fundamentals/lazy-loading-modules)

## Mocking / Spying 패턴에서 초기화 지연
테스트 환경에서 무거운 service를 그냥 Proxy로 감싸고, 테스트가 실제로 그 값 접근할 때 작동하도록 만들 수 있음.

Mocha/Jest 환경에서도 사용 가능.