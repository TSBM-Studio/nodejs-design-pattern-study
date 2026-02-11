## Docker 이미지 구조 이해 (Layer 기반)

- Dockerfile 의 각 명령이 새로운 레이터를 만든다.

```jsx
FROM node:22-alpine     # Layer 1
WORKDIR /app            # Layer 2
COPY package*.json ./   # Layer 3
RUN npm ci              # Layer 4
COPY . .                # Layer 5
CMD ["npm", "start"]    # Layer 6

```

- Layer 캐싱 로직
  1. **명령(Instruction)이 동일해야 함**
  2. **명령에 영향을 주는 파일들이 변경되지 않아야 함**

```jsx
COPY package*.json ./
RUN npm ci
COPY . .
```

→ package\*.json이 변하지 않으면 npm ci 레이어에서도 그대로 캐시가 재사용된다.

## Dockerfile의 문제점

```jsx
FROM node:22
WORKDIR /app

COPY . .            # 코드가 바뀔 때마다 매번 무효화
RUN npm install     # 매번 재설치됨

CMD ["npm", "start"]

```

## Dockerfile 최적화

1. 변경 가능성이 낮은 파일부터 COPY
2. node_modules 설치 레이어를 최대한 캐싱
3. devDependencies 제거
4. Alpine 기반으로 경량화

```jsx
FROM node:22-alpine
WORKDIR /app

# 1) 변경 가능성 낮은 파일 먼저
COPY package*.json ./
RUN npm ci --only=production

# 2) 이후 나머지 소스
COPY . .

CMD ["npm", "start"]
```

- 빌드 도구도 최종 배포에 포함하지 않을 수 있음

```jsx
FROM node:22-alpine as build
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /app/dist ./dist

CMD ["node", "dist/app.js"]

```

## Java 최적화와 다른 점

| Node.js 핵심        | Java 핵심                 |
| ------------------- | ------------------------- |
| node_modules 최적화 | JDK 제거 (JRE/Distroless) |
| 레이어 캐시 유지    | Layered JAR 사용 가능     |
| Multi-stage         | Multi-stage + JVM 튜닝    |

- java Dockerfile 최적화

```jsx
FROM eclipse-temurin:21-jdk-alpine as build
WORKDIR /app
COPY . .
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:21-jre-alpine # 빌드 도구 제외한 jre만 포함
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

```
