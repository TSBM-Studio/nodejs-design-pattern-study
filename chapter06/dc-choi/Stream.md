# 스트림의 중요성

## 버퍼링 대 스트리밍
입력 작업의 경우 버퍼모드에서는 작업이 완료될 때 까지 리소스에서 들어오는 모든 데이터를 버퍼에 수집함.

매우 큰 파일을 읽어야 하는 경우 모든 데이터를 버퍼에 수집하는 건 좋은 생각이 아님.

반면 스트림을 사용하면 리소스에서 데이터 청크가 수신되는 즉시 모든 데이터가 버퍼에 수집될 때 까지 기다리지 않고 즉시 전송됨.

## 공간 효율성
효율성 관점에서 스트림은 공간과 시간 측면에서 더 효율적임.

그리고 Node.js 스트림에는 또 다른 중요한 결합성이라는 것이 있음.

```js
import { createReadStream, createWriteStream } from 'fs'
import { createGzip } from 'zlib'

const filename = process.argv[2]

createReadStream(filename)
    .pipe(createGzip())
    .pipe(createWriteStream(`${filename}.gz`))
    .on('finish', () => console.log('File successfully compressed'))
```

스트림은 인터페이스와 결합성으로 인해 우아하고 깔끔하며 간결한 코드를 작성할 수 있음.

## 시간 효율성
스트림을 사용하면 전체 파일을 읽을 때 까지 기다리지 않고 데이터 청크를 수신하자마자 처리할 수 있음.

다른 데이터 청크를 사용할 수 있을 때 이전 데이터의 청크 작업이 완료될 때 까지 기다릴 필요가 없음.

우리가 실행하는 각 작업이 비동기적이므로 Node.js에 의해 병렬화 될 수 있기 때문에 완벽하게 동작함.

유일한 제약은 청크가 각 단계에 도착하는 순서를 유지해야한다는 것임. 이는 내부 구현이 우리를 위해 순서를 유지시켜줌.

모든 데이터를 한번에 읽고 처리하는데 시간을 낭비하지 않아 전체 프로세스에 소요되는 시간이 줄어듬.

## 조립성
pipe() 함수 덕분에 스트림을 구성하는 방법에 대한 개요를 제공함.

이 함수는 각각 하나의 단일 기능을 담당하는 여러 프로세스들을 연결할 수 있게 해줌.

유일한 전제조건은 파이프라인의 다음 스트림이 이전 스트림에 의해 생성된 데이터 형태를 지원해야 한다는 것.

# 스트림 시작하기
스트림은 핵심 모듈부터 시작하여 Node.js의 모든 곳에 존재.

fs 모듈에는 파일 읽기용 createReadStream() 및 파일 쓰기용 createWriteStream()

HTTP 요청 및 응답 객체는 기본적으로 스트림

zlib 모듈을 사용하면 스트림 인터페이스를 사용하여 데이터를 압축 및 압축 해제

암호화 모듈조차도 createCipheriv와 createDecipheriv와 같은 몇몇 유용한 스트리밍 기본 요소들을 노출함.

## 스트림 해부
Node.js의 모든 스트림은 스트림 모듈에서 사용할 수 있는 네 가지 기본 추상 클래스중 하나의 구현임.

- Readable: 데이터를 읽을 수 있는 스트림
- Writable: 데이터를 쓸 수 있는 스트림
- Duplex: 읽기 및 쓰기가 모두 가능한 스트림
- Transform: 읽기 및 쓰기가 모두 가능하며 입력 데이터를 변환하는 스트림

각 스트림 클래스는 EventEmitter의 인스턴스이기도 함.

읽기 스트림이 읽기를 마치면 'end', 쓰기 스트림이 쓰기를 완료했을 때 'finish', 무언가 잘못되었을 때 'error' 와 같은 이벤트가 발생함.

스트림이 매우 유연한 이유 중 하나는 바이너리 데이터뿐만 아니라 거의 모든 JS값을 처리할 수 있다는 사실임.

- Binary: 버퍼 또는 문자열과 같은 청크 형태로 데이터를 스트리밍
- Object: 데이터를 일련의 개별 객체로 스트리밍

이 두가지 동작 모드를 통해 I/O뿐만 아니라 함수 방식으로 처리 단위를 우아하게 구성할 수 있음.

## Readable 스트림
Readable 스트림에서 데이터를 수신하는 방법에는 두 가지가 있음.

### non-flowing, flowing 모드
STUDY.md에서 정리.

### 비동기 반복자
Readable 스트림은 Iterator이기도 함. 따라서 for await...of 루프에서 사용할 수 있음.

### 구현
Readable 프로토타입을 상속하여 새로운 클래스를 만들어야 함.

구현된 클래스는 다음과 같은 특징을 가진 _read() 메서드를 포함해야 함.

```js
readable._read(size)
```

Readable 클래스는 내부적으로 _read() 메서드를 호출하는데 이 함수는 push() 메서드를 사용하여 내부 버퍼를 채움.

```js
readable.push(chunk)
```

자세한 내용은 code부분 참고.

## Writable 스트림
대상 데이터의 목적지를 나타냄.

파일시스템의 파일, 데이터베이스 테이블, 소켓, 표준 입출력 및 오류 인터페이스를 생각할 수 있음.

### 스트림에 쓰기
데이터를 스트림에 밀어 넣는 것은 간단함. 우리가 해야할 일은 다음과 같은 write() 메서드를 호출하는 것임.

```js
writable.write(chunk, [encoding], [callback])
```

인코딩 인자는 선택 사항이며 청크가 문자열일 경우 지정할 수 있음.

반면 콜백 인자는 청크가 기본 리소스로 플러시 될 때 호출되며 선택사항이기도 함.

더 이상 스트림에 기록할 데이터가 없다면 end() 메서드를 호출하여 스트림을 종료해야 함.

```js
writable.end([chunk], [encoding], [callback])
```

이 메서드를 통해 최종 데이터 청크를 제공할 수 있음.

이경우 콜백은 스트림에 기록된 모든 데이터가 플러시 될 때 실행되는 리스너를 finish 이벤트에 등록하는 것과 같음.

예시 코드는 code부분 참고.

### Backpressure
Node.js 스트림이 소비할 수 있는 것보다 더 빨리 데이터가 기록되는 병목현상이 발생할 수 있다.

내부 버퍼에 점점 더 많은 데이터가 축적되어 원하지 않는 수준의 메모리 사용량이 발생하는 상황이 발생함.

이를 방지하기 위해 writeable.write()는 내부 버퍼가 highWaterMark 임계값에 도달하면 false를 반환함.

Writable 스트림에서 highWaterMark 속성은 write()가 false를 반환하기 시작하는 내부 버퍼 크기의 제한으로 어플리케이션이 쓰기를 중단해야하는 한도를 나타냄.

버퍼가 비워지면 'drain' 이벤트가 발생하여 다시 쓰기를 시작해도 안전함을 알림. 이런 매커니즘을 backpressure라고 함.

이는 권고사항이다. write()가 false를 반환하더라도 계속해서 데이터를 쓸 수 있지만, 이는 메모리 사용량이 증가할 수 있음을 의미함.

highWaterMark 임계값에 도달한다고 스트림이 자동으로 차단되지 않음. 항상 주의를 기울이고 배압을 처리해주는게 좋다.

```js
import fs from 'fs';

const readable = fs.createReadStream('./bigfile.txt');
const writable = fs.createWriteStream('./copy.txt');

readable.on('data', (chunk) => {
  const ok = writable.write(chunk);

  if (!ok) {
    readable.pause(); // 생산자 멈춤
    writable.once('drain', () => readable.resume()); // 소비자가 준비되면 다시 시작
  }
});
```

다른 궁금증은 STUDY.md 참고.

### 구현
Writable 프로토타입을 상속하여 새로운 클래스를 만들어야 함.

구현된 클래스는 다음과 같은 특징을 가진 _write() 메서드를 포함해야 함.

```js
writable._write(chunk, encoding, callback)
```

자세한 내용은 code부분 참고.

## Duplex 스트림
Duplex 스트림은 읽기 및 쓰기가 가능한 스트림임. Readable 및 Writable 스트림을 상속 받음.

Duplex 스트림을 생성하려면 _read() 및 _write() 메서드를 모두 구현해야 함.

생성자에 전달되는 options 객체는 내부적으로 Readable 및 Writable 생성자에 모두 전달됨.

한쪽에서는 객체 모드로, 다른 쪽에서는 바이너리 모드로 작동하는 Duplex 스트림을 만들 수 있음.

ReadableObjectMode 및 WritableObjectMode 옵션을 독립적으로 사용하여 이를 제어할 수 있음.

## Transform 스트림
Transform 스트림은 데이터 변환을 처리하도록 특별히 설계된 특수한 종류의 Duplex 스트림임.

단순 Duplex 스트림에서는 읽은 데이터와 스트림 안에 기록된 데이터 사이에 즉각적인 관계가 없음.

반면 Transform 스트림은 쓰기 가능한 쪽에서 받은 각 데이터 청크에 변환을 적용한 다음 변환된 데이터를 읽기 가능한 쪽에서 사용할 수 있도록 함.

외부에서 Transform 스트림의 인터페이스는 Duplex 스트림과 동일함.

하지만 추가적으로 _transform(), _flush() 메서드를 구현해야 함.

```js
transform._transform(chunk, encoding, callback)
```

_transform() 메서드는 Writable 스트림의 _write() 메서드와 거의 동일한 특성을 가짐.

리소스에 데이터를 쓰는 대신 Readable 스트림의 _read()와 마찬가지로 push() 메서드를 사용하여 변환된 데이터를 내부 버퍼에 푸시함.

```js
transform._flush(callback)
```

_flush() 메서드는 스트림이 종료되기 전에 호출되며, 남아있는 모든 데이터를 처리하는 데 사용할 수 있음.

```js
import { Transform } from 'stream';

class UpperCaseTransform extends Transform {
    _transform(chunk, encoding, callback) {
        const upperChunk = chunk.toString().toUpperCase();
        this.push(upperChunk);
        callback();
    }
  
    _flush(callback) {
        // 스트림 종료 전에 필요한 정리 작업 수행
        callback();
    }
}

const upperCaseTransform = new UpperCaseTransform();
process.stdin.pipe(upperCaseTransform).pipe(process.stdout);
```

자세한 내용은 code부분 참고.

## PassThrough 스트림
PassThrough 스트림은 Transform 스트림의 특수한 형태로, 입력 데이터를 변환하지 않고 그대로 출력함.

이는 Transform 스트림의 기본 동작을 단순히 전달하는 역할을 함.

```js
import { PassThrough } from 'stream';

const passThrough = new PassThrough();
process.stdin.pipe(passThrough).pipe(process.stdout);
```

주로 사용하는 부분은 모니터링, 로깅 또는 디버깅 목적으로 스트림 파이프라인에 삽입할 때임.

## 파이프를 사용하여 스트림 연결하기
Unix 파이프는 프로그램의 출력이 다른 프로그램의 입력으로 연결되는 메커니즘임.

비슷한 방식으로 Node.js 스트림은 pipe() 메서드를 사용하여 서로 연결할 수 있음.

```js
readableStream.pipe(writableStream, [options]);
```

매우 직관적으로 readable 스트림의 출력을 writable 스트림의 입력으로 연결함.

```js
import { createReadStream, createWriteStream } from 'fs';
const readStream = createReadStream('input.txt');
const writeStream = createWriteStream('output.txt');

readStream.pipe(writeStream);
```

### 파이프 및 오류 처리
오류 이벤트는 파이프라인을 통해 자동으로 전파되지 않음.

각각의 파이프라인에 일일히 예외처리를 해줘야 함.

```js
stream1
    .on('error', () => {})
    .pipe(stream2)
    .on('error', () => {})
```

### pipeline()을 사용한 개선된 오류처리
다음과 같이 pipeline() 함수를 사용하여 스트림 파이프라인을 생성할 수 있음.
```js
pipeline(stream1, stream2, stream3, ..., callback);
```

이 유틸 함수는 인자에 전달된 모든 스트림을 다음 스트림으로 파이프함.

그리고 각 스트림에 대해 적절한 에러를 등록하고 리스너를 닫음.

```js
import { pipeline } from 'stream';
import { createReadStream, createWriteStream } from 'fs';

const readStream = createReadStream('input.txt');
const writeStream = createWriteStream('output.txt');

pipeline(
    readStream,
    writeStream,
    (err) => {
        if (err) {
            console.error('Pipeline failed.', err);
        } else {
            console.log('Pipeline succeeded.');
        }
    }
);
```

# 스트림을 사용한 비동기 제어 흐름 패턴
스트림을 활용하여 비동기 제어 흐름(asynchronous control flow)을 흐름 제어(flow control)로 바꿀 수 있음.

즉, 원래 async/await로 순서 제어하던 것을 데이터 흐름 자체가 처리 속도를 조절해주는 구조(flow control)로 바꿀 수 있다.

## 순차적 실행
기본적으로 스트림은 데이터를 순서대로 처리함.

스트림을 전통적인 제어 흐름 패턴에 대한 우아한 대안으로 전환하는데 이용할 수 있음.

## 순서가 없는 병렬 실행
때로는 Node.js의 동시성을 최대한 활용하지 못하기 때문에 병목 현상이 발생할 수 있음.

모든 데이터 청크에 대해 느린 비동기 작업을 실행해야 하는 경우 실행을 병렬화하여 전체 프로세스 속도를 높이는 것이 유리할 수 있음.

물론 이 패턴은 각 데이터 청크 사이에 관계가 없는 경우에만 적용할 수 있음.

### 구현
자세한 내용은 code 부분 참고.

## 순서가 있는 병렬 실행
때때로 청크를 수신한 순서대로 보내되, 각 청크에 대해 비동기 작업을 병렬로 실행하고 싶을 수 있음.

각 작업에서 내보내는 데이터를 정렬하여 데이터가 수신된 것과 동일한 순서를 따르게 하는 것임.

### 구현
자세한 내용은 code 부분 참고.

# 파이핑(Piping) 패턴
Node.js 스트림은 서로 다른 패턴들을 조합하여 함께 파이프로 연결할 수도 있음.

실제로 두 개의 서로 다른 스트림의 흐름을 하나로 병합하거나 한 스트림의 흐름을 둘 이상의 파이프로 분할하거나 조건에 따라 흐름을 리다이렉션 할 수 있음.

## 스트림 결합
pipe()나 pipeline()을 사용하여 여러 스트림을 함께 연결할 수 있음.

그러나 마지막 Readable 스트림만 반환하기 때문에 전체 파이프라인을 하나의 Duplex 스트림처럼 사용할 수 없음.

### 구현
자세한 내용은 code 부분 참고.

## 스트림 분기
단일 Readable 스트림을 여러 Writable 스트림으로 파이핑하여 스트림 분기를 수행할 수 있음.

동일한 데이터를 다른 목적지로 보내거나 다른 변환을 수행하거나 데이터를 분할하려고 하는 경우에도 사용할 수 있음.

### 구현
자세한 내용은 code 부분 참고.

## 스트림 병합
여러 Readable 스트림을 단일 Writable 스트림으로 파이핑하여 스트림 병합을 수행할 수 있음.

### 구현
자세한 내용은 code 부분 참고.

## 멀티플렉싱 및 디멀티플렉싱
멀티 플렉싱: 단일 스트림을 통한 전송을 허용하기 위해 여러 스트림(채널이라고 함)을 결합하는 작업

디멀티플렉싱: 공유 스트림에서 수신된 데이터를 원래의 스트림으로 재구성하는 작업

이런 작업을 수행하는 장치를 각각 멀티플렉서, 디멀티플렉서라고 함.

이것은 일반적으로 컴퓨터 과학 및 통신 분야에서 널리 연구되는 분야임.

### 구현
자세한 내용은 code 부분 참고.