# Chapter 6: 스트림 코딩 (Stream Coding)

> **발표자**: 길현준
> **주제**: Node.js 스트림을 활용한 효율적인 데이터 처리

---

## 📌 목차

1. [왜 스트림인가?](#1-왜-스트림인가)
2. [스트림의 4가지 타입](#2-스트림의-4가지-타입)
3. [실전 패턴](#3-실전-패턴)
4. [Best Practices](#4-best-practices)
5. [실습 코드](#5-실습-코드)

---

## 1. 왜 스트림인가?

### 핵심 개념

> "모든 것을 스트리밍 하십시오!" - Dominic Tarr

스트림은 **Node.js에서 최고이자 가장 오해받는 개념**입니다. 버퍼링 방식 대신 스트리밍을 사용하면:

- **공간 효율성**: 메모리 사용량을 일정하게 유지
- **시간 효율성**: 데이터를 받는 즉시 처리 시작
- **조립성**: 작은 모듈을 조합하여 복잡한 기능 구현

### 버퍼링 vs 스트리밍 비교

| 측면 | 버퍼링 | 스트리밍 |
|------|--------|----------|
| **메모리 사용** | 전체 데이터 크기만큼 | 일정 (청크 크기만큼) |
| **처리 시작** | 데이터 수신 완료 후 | 첫 청크 수신 즉시 |
| **파일 크기 제한** | Buffer.MAX_LENGTH (약 2GB) | 제한 없음 |
| **적용 사례** | 작은 파일, 전체 데이터 필요 | 대용량 파일, 실시간 처리 |

### 실제 예시: 파일 압축

**❌ 버퍼링 방식 (비효율적)**

```javascript
import { promises as fs } from 'fs'
import { gzip } from 'zlib'
import { promisify } from 'util'

const gzipPromise = promisify(gzip)

// 문제: 파일이 2GB 넘으면 에러 발생
const file = await fs.readFile(filename)
const compressed = await gzipPromise(file)
await fs.writeFile(`${filename}.gz`, compressed)
```

**✅ 스트리밍 방식 (효율적)**

```javascript
import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'
import { pipeline } from 'stream/promises'

// 파일 크기 무관하게 일정한 메모리 사용
await pipeline(
  createReadStream(filename),
  createGzip(),
  createWriteStream(`${filename}.gz`)
)
```

---

## 2. 스트림의 4가지 타입

### 타입 개요

| 타입 | 설명 | 주요 메서드 | 사용 예 |
|------|------|-------------|---------|
| **Readable** | 데이터 읽기 | `read()`, `on('data')` | 파일 읽기, HTTP 응답 |
| **Writable** | 데이터 쓰기 | `write()`, `end()` | 파일 쓰기, HTTP 요청 |
| **Duplex** | 읽기 + 쓰기 | 위 둘 다 | TCP 소켓 |
| **Transform** | 데이터 변환 | `_transform()` | 압축, 암호화 |

### 2-1. Readable 스트림

데이터를 소비하는 두 가지 방법:

**방법 1: Non-flowing 모드 (Pull 방식)**

```javascript
process.stdin
  .on('readable', () => {
    let chunk
    while ((chunk = process.stdin.read()) !== null) {
      console.log(`읽음: ${chunk.toString()}`)
    }
  })
  .on('end', () => console.log('종료'))
```

**방법 2: Flowing 모드 (Push 방식)**

```javascript
process.stdin
  .on('data', chunk => {
    console.log(`받음: ${chunk.toString()}`)
  })
  .on('end', () => console.log('종료'))
```

### 2-2. Writable 스트림

**기본 사용법**

```javascript
import { createWriteStream } from 'fs'

const stream = createWriteStream('output.txt')

stream.write('첫 번째 줄\n')
stream.write('두 번째 줄\n')
stream.end('마지막 줄\n')

stream.on('finish', () => console.log('완료'))
```

**Backpressure 처리**

```javascript
function writeMany(stream, data, encoding, callback) {
  let i = 0

  function write() {
    let ok = true
    while (i < data.length && ok) {
      ok = stream.write(data[i], encoding)
      i++
    }

    if (i < data.length) {
      // 버퍼가 가득 참 - drain 이벤트 대기
      stream.once('drain', write)
    } else {
      callback()
    }
  }

  write()
}
```

### 2-3. Transform 스트림

**커스텀 Transform 구현 예시**

```javascript
import { Transform } from 'stream'

class ReplaceStream extends Transform {
  constructor(searchStr, replaceStr, options) {
    super(options)
    this.searchStr = searchStr
    this.replaceStr = replaceStr
    this.tail = ''
  }

  _transform(chunk, encoding, callback) {
    const pieces = (this.tail + chunk).split(this.searchStr)
    this.tail = pieces[pieces.length - 1]

    // 마지막 조각 제외하고 모두 처리
    for (let i = 0; i < pieces.length - 1; i++) {
      this.push(pieces[i] + this.replaceStr)
    }

    callback()
  }

  _flush(callback) {
    this.push(this.tail)
    callback()
  }
}

// 사용 예
import { createReadStream, createWriteStream } from 'fs'

createReadStream('input.txt')
  .pipe(new ReplaceStream('World', 'Node.js'))
  .pipe(createWriteStream('output.txt'))
```

---

## 3. 실전 패턴

### 3-1. 순차 처리 - pipeline()

`pipe()` 대신 `pipeline()` 사용을 권장합니다:

**장점:**
- ✅ 자동 에러 처리
- ✅ 스트림 자동 정리
- ✅ Promise 기반

```javascript
import { pipeline } from 'stream/promises'
import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'

try {
  await pipeline(
    createReadStream('input.txt'),
    createGzip(),
    createWriteStream('input.txt.gz')
  )
  console.log('압축 완료')
} catch (err) {
  console.error('에러:', err)
}
```

### 3-2. 병렬 처리

**비순차 병렬 처리 (Unordered Parallel)**

```javascript
import { Transform } from 'stream'

class ParallelStream extends Transform {
  constructor(userTransform, options) {
    super({ objectMode: true, ...options })
    this.userTransform = userTransform
    this.running = 0
    this.concurrency = options?.concurrency || 2
  }

  _transform(chunk, encoding, callback) {
    this.running++

    this.userTransform(
      chunk,
      encoding,
      (err, transformedChunk) => {
        this.running--

        if (err) {
          return callback(err)
        }

        this.push(transformedChunk)
        callback()
      }
    )

    // 동시성 제한 체크
    if (this.running < this.concurrency) {
      callback()
    }
  }

  _flush(callback) {
    if (this.running > 0) {
      return this.once('drain', () => callback())
    }
    callback()
  }
}
```

**사용 예: URL 체커**

```javascript
import { pipeline } from 'stream/promises'
import split from 'split2'

await pipeline(
  createReadStream('urls.txt'),
  split(),
  new ParallelStream(async (url, enc, cb) => {
    try {
      const res = await fetch(url)
      cb(null, `${url}: ${res.status}\n`)
    } catch (err) {
      cb(null, `${url}: ERROR\n`)
    }
  }, { concurrency: 5 }),
  createWriteStream('results.txt')
)
```

### 3-3. 파이핑 패턴

**결합된 스트림 (Combined Streams)**

```javascript
import { pipeline } from 'stream'
import { createGzip } from 'zlib'
import { createCipheriv, randomBytes } from 'crypto'

// Pumpify를 사용한 재사용 가능한 스트림
import pumpify from 'pumpify'

function createCompressAndEncrypt(password) {
  const iv = randomBytes(16)
  const key = scryptSync(password, 'salt', 32)

  return new pumpify(
    createGzip(),
    createCipheriv('aes-256-cbc', key, iv)
  )
}

// 사용
createReadStream('secret.txt')
  .pipe(createCompressAndEncrypt('mypassword'))
  .pipe(createWriteStream('secret.enc'))
```

**멀티플렉싱 (Multiplexing)**

여러 채널을 하나의 스트림으로 통합:

```javascript
// 간단한 프로토콜: [channelID(1byte)][length(4bytes)][data]
function multiplexChannels(sources) {
  const dest = new PassThrough()

  for (const [channelId, source] of sources.entries()) {
    source
      .on('data', chunk => {
        const header = Buffer.allocUnsafe(5)
        header.writeUInt8(channelId, 0)
        header.writeUInt32BE(chunk.length, 1)
        dest.write(header)
        dest.write(chunk)
      })
      .on('end', () => {
        if (sources.every(s => s.readableEnded)) {
          dest.end()
        }
      })
  }

  return dest
}

// 사용: stdout과 stderr를 하나의 스트림으로
const muxed = multiplexChannels([process.stdout, process.stderr])
muxed.pipe(networkSocket)
```

---

## 4. Best Practices

### 핵심 원칙

| 원칙 | 설명 | 예시 |
|------|------|------|
| **작게 만들기** | 한 가지 일만 잘하는 스트림 | Transform은 하나의 변환만 |
| **조합성** | 작은 스트림을 연결 | `pipe()` 체인으로 복잡한 로직 구현 |
| **에러 처리** | `pipeline()` 사용 | 자동 에러 전파 및 정리 |
| **Backpressure** | 흐름 제어 존중 | `write()` 반환값 확인 |

### 실무 체크리스트

**스트림 사용이 적합한 경우:**
- ✅ 대용량 파일 처리
- ✅ 실시간 데이터 처리
- ✅ 메모리 효율성이 중요한 경우
- ✅ 네트워크 데이터 전송

**스트림 사용을 피해야 하는 경우:**
- ❌ 작은 데이터 (몇 KB 이하)
- ❌ 전체 데이터가 필요한 경우 (정렬, 집계 등)
- ❌ 랜덤 액세스가 필요한 경우

### 주요 함정 피하기

**1. pipe() 대신 pipeline() 사용**

```javascript
// ❌ 나쁜 예: 에러 처리 누락
readStream.pipe(transformStream).pipe(writeStream)

// ✅ 좋은 예: 자동 에러 처리
await pipeline(readStream, transformStream, writeStream)
```

**2. Backpressure 무시하지 않기**

```javascript
// ❌ 나쁜 예: write() 반환값 무시
for (const data of largeArray) {
  stream.write(data) // 메모리 누수 위험
}

// ✅ 좋은 예: drain 이벤트 대기
for (const data of largeArray) {
  if (!stream.write(data)) {
    await new Promise(resolve => stream.once('drain', resolve))
  }
}
```

**3. Object Mode 적절히 활용**

```javascript
// JSON 스트림 파싱 예
import JSONStream from 'JSONStream'

createReadStream('data.json')
  .pipe(JSONStream.parse('*')) // Object mode로 변환
  .pipe(new Transform({
    objectMode: true,
    transform(obj, enc, cb) {
      // 객체 단위로 처리
      cb(null, processObject(obj))
    }
  }))
```

---

## 5. 실습 코드

### 디렉토리 구조

```
chapter6/kilhyeonjun/code/
├── README.md                   # 실행 가이드
├── package.json
├── gzip-stream.js             # 기본 스트리밍
├── replace-stream.js          # Transform 구현
└── parallel-stream.js         # 병렬 처리
```

### 실행 방법

```bash
# 디렉토리 이동
cd chapter6/kilhyeonjun/code

# 의존성 설치
npm install

# 1. 파일 압축 예제
node gzip-stream.js input.txt

# 2. 텍스트 치환 예제
echo "Hello World" | node replace-stream.js World Node.js

# 3. URL 체커 예제
node parallel-stream.js urls.txt
```

### 주요 예제

각 예제는 다음을 포함합니다:
1. **gzip-stream.js**: 스트리밍 기본 개념
2. **replace-stream.js**: 커스텀 Transform 구현
3. **parallel-stream.js**: 동시성 제어와 병렬 처리

---

## 참고 자료

### 공식 문서
- [Node.js Stream API](https://nodejs.org/api/stream.html)
- [Stream Handbook (substack)](https://github.com/substack/stream-handbook)

### 유용한 라이브러리
- **split2**: 라인별 스트림 분할
- **JSONStream**: JSON 스트리밍 파싱
- **pumpify**: 스트림 결합
- **multistream**: 스트림 병합
- **parallel-transform**: 병렬 Transform

### 핵심 요약

| 개념 | 핵심 내용 |
|------|----------|
| **스트림이란?** | 데이터를 청크 단위로 처리하는 패턴 |
| **왜 사용?** | 메모리 효율성 + 시간 효율성 + 조립성 |
| **4가지 타입** | Readable, Writable, Duplex, Transform |
| **Best Practice** | `pipeline()` 사용, Backpressure 존중 |
| **적용 사례** | 대용량 파일, 실시간 처리, 네트워크 전송 |

---

**마무리**

스트림은 Node.js의 핵심 패턴입니다. "작게 만들고 조합하라"는 Unix 철학을 완벽히 구현하며, 효율적인 데이터 처리의 기초가 됩니다.

다음 챕터에서는 객체지향 디자인 패턴을 배워봅시다! 🚀
