# Chapter 6 실습 코드

Node.js 스트림 코딩 실습 예제입니다.

## 📦 설치

```bash
cd chapter6/kilhyeonjun/code
npm install
```

## 🚀 예제 실행

### 1. 파일 압축 (gzip-stream.js)

**학습 목표**: 스트리밍의 기본 개념과 `pipeline()` 사용법

```bash
# 테스트 파일 생성
echo "Hello Node.js Streams!" > test.txt

# 압축 실행
node gzip-stream.js test.txt

# 결과 확인
ls -lh test.txt*
```

**핵심 개념**:
- `createReadStream` - 파일 읽기 스트림
- `createGzip` - Transform 스트림 (압축)
- `createWriteStream` - 파일 쓰기 스트림
- `pipeline()` - 자동 에러 처리

---

### 2. 텍스트 치환 (replace-stream.js)

**학습 목표**: 커스텀 Transform 스트림 구현

```bash
# 기본 사용법
echo "Hello World" | node replace-stream.js World Node.js

# 파일에서 읽어서 치환
cat test.txt | node replace-stream.js Node.js "Node.js Streams"

# 결과를 파일로 저장
cat test.txt | node replace-stream.js old new > output.txt
```

**핵심 개념**:
- `Transform` 클래스 상속
- `_transform()` 메서드 - 데이터 변환 로직
- `_flush()` 메서드 - 스트림 종료 시 처리
- 청크 경계 처리 (`this.tail` 패턴)

---

### 3. 병렬 URL 체커 (parallel-stream.js)

**학습 목표**: 동시성 제어와 병렬 처리

```bash
# 테스트용 URL 파일 생성
cat > urls.txt << EOF
https://google.com
https://github.com
https://nodejs.org
https://example.com
https://invalid-url-that-does-not-exist.com
EOF

# URL 체크 실행 (동시성 5)
node parallel-stream.js urls.txt
```

**핵심 개념**:
- Object mode 스트림
- 동시성 제어 (`concurrency` 옵션)
- Backpressure 처리
- `split2` 라이브러리로 라인 단위 처리

---

## 📝 예제별 특징

| 예제 | 난이도 | 핵심 개념 | 실무 적용 |
|------|--------|----------|-----------|
| **gzip-stream** | 기초 | 기본 스트림 연결 | 파일 압축, 로그 아카이빙 |
| **replace-stream** | 중급 | Transform 구현 | 데이터 변환, 필터링 |
| **parallel-stream** | 고급 | 동시성 제어 | 배치 처리, 크롤링 |

## 💡 실습 팁

### 디버깅

스트림의 데이터 흐름을 확인하려면:

```javascript
import { PassThrough } from 'stream'

const debugStream = new PassThrough()
debugStream.on('data', chunk => {
  console.log('데이터:', chunk.toString())
})

// pipeline에 삽입
await pipeline(
  source,
  debugStream,
  destination
)
```

### 성능 측정

```javascript
import { performance } from 'perf_hooks'

const start = performance.now()

await pipeline(/* ... */)

const duration = performance.now() - start
console.log(`실행 시간: ${duration.toFixed(2)}ms`)
```

### 메모리 사용량 확인

```javascript
const before = process.memoryUsage()

await pipeline(/* ... */)

const after = process.memoryUsage()
const diff = (after.heapUsed - before.heapUsed) / 1024 / 1024

console.log(`메모리 사용량: ${diff.toFixed(2)}MB`)
```

## 🔧 추가 실습 아이디어

1. **CSV 파서 스트림**: CSV 파일을 읽어 객체로 변환
2. **파일 암호화**: Cipher 스트림으로 파일 암호화/복호화
3. **라인 카운터**: 파일의 총 라인 수 세기
4. **JSON 스트림 파서**: 대용량 JSON 배열 처리
5. **HTTP 프록시**: 요청을 다른 서버로 전달

## 📚 참고 자료

- [Node.js Stream API](https://nodejs.org/api/stream.html)
- [Stream Handbook](https://github.com/substack/stream-handbook)
- [split2 라이브러리](https://www.npmjs.com/package/split2)
