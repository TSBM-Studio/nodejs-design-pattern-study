# Factory 기반의 인증 모듈 리팩토링

## 1. 인증 모듈 요구사항

- **refresh token은 Redis에 저장하고 싶다**
- 이후 토큰 저장 방식 또는 사용자 저장 방식이 변경될 수 있다
- 테스트에서는 Fake Repo를 써야 한다
- 구현체 선택이 Service 내부에 박혀 있으면 교체가 불가능하다

---

## 2. 왜 “추상화된 것”에 의존해야 하는가?

> 고수준 모듈은 저수준 모듈에 의존하면 안 된다.
> 둘 다 추상화(interface)에 의존해야 한다.

```tsx
// X - 구현체(RedisTokenStore)에 직접 의존
class TokenService {
  private store = new RedisTokenStore();
}

// O - 추상화(TokenStore)에만 의존
class TokenService {
  constructor(private readonly store: TokenStore) {}
}
```

## 3. 기존 인증 모듈에서 문제가 되었던 구조

- 초기 구현

```jsx

class MemoryPersistenceFactory implements AuthPersistenceFactory {
  createUserRepository() → MemoryUserRepo
  createTokenStore() → MemoryTokenStore
}

class RedisPersistenceFactory implements AuthPersistenceFactory {
  createUserRepository() → MemoryUserRepo ❓
  createTokenStore() → RedisTokenStore
}
```

## 4. 리팩토링 방향: 역할 단위 팩토리로 재구성

- UserRepositoryFactory

```jsx
export interface UserRepositoryFactory {
  createUserRepository(): UserRepository;
}

export class MemoryUserRepositoryFactory implements UserRepositoryFactory {
  createUserRepository(): UserRepository {
    return new MemoryUserRepo();
  }
}
```

- TokenStoreFactory — refresh token 저장만 담당

```jsx

export interface TokenStoreFactory {
  createTokenStore(): TokenStore;
}

export class RedisTokenStoreFactory implements TokenStoreFactory {
  constructor(private readonly redisUrl: string) {}
  createTokenStore(): TokenStore {
    return new RedisTokenStore(this.redisUrl);
  }
}

export class MemoryTokenStoreFactory implements TokenStoreFactory {
  createTokenStore(): TokenStore {
    return new MemoryTokenStore();
  }
}
```

- AuthModuleFactory

```jsx

export class AuthModuleFactory {
  constructor(
    private readonly userRepoFactory: UserRepositoryFactory,
    private readonly tokenStoreFactory: TokenStoreFactory
  ) {}

  createAuthService(): AuthService {
    return new AuthService(
      this.userRepoFactory.createUserRepository(),
      this.tokenStoreFactory.createTokenStore()
    );
  }
}
```

- 사용 예시

```jsx

const auth = new AuthModuleFactory(
  new MemoryUserRepositoryFactory(),
  new RedisTokenStoreFactory(process.env.REDIS_URL!)
).createAuthService();
```
