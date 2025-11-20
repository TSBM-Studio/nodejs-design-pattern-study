# non-flowing과 flowing 차이점

## non-flowing 모드
특징
1. 스트림이 자동으로 데이터를 밀어주지 않음 
2. 데이터를 가져오려면 직접 read() 호출해야 함 
3. 이벤트를 듣지 않는 상태에서는 기본적으로 non-flowing

언제?
1. data 이벤트 리스너를 등록하지 않았을 때 
2. 또는 stream.pause()를 호출했을 때 
3. fs.createReadStream()도 기본은 non-flowing

```js
const fs = require("fs");

const stream = fs.createReadStream("text.txt");

// non-flowing: read() 을 호출할 때만 데이터 가져옴
let chunk;
while ((chunk = stream.read()) !== null) {
  console.log("chunk:", chunk.toString());
}
```

정리: 개발자가 “내가 요청할 때만 줘” 하는 pull 방식.

## flowing 모드
특징
1. 스트림이 데이터를 최대한 빨리 push 해서 events로 전달
2. 읽는 쪽이 계속 이어받지 못하면 내부 버퍼가 찰 수 있음
3. data 이벤트 리스너 등록하는 순간 자동 flowing 모드로 전환

언제?
1. stream.on("data", handler)을 등록하면 바로 flowing 시작
2. stream.resume()을 호출해도 flowing

```js
const fs = require("fs");

const stream = fs.createReadStream("text.txt");

// flowing mode: 알아서 data 이벤트로 계속 밀어줌
stream.on("data", (chunk) => {
  console.log("chunk:", chunk.toString());
});
```

정리: 스트림이 “나 이제 계속 흘려보낼게, 받아~” 하는 push 방식.

## pipe() 는 flowing 모드인가?
네. pipe를 쓰면 데이터가 자동으로 계속 흘러감.

```js
fs.createReadStream("a.txt")
  .pipe(fs.createWriteStream("b.txt"));
```

## 어떤 모드가 더 좋은가?

### flowing 모드
1. 단순 파일 복사, 네트워크 스트리밍 → 가장 쉬움 
2. 이벤트 기반 push

### non-flowing 모드
1. 백프레셔(backpressure)를 직접 제어해야 할 때
2. 데이터 chunk 개수를 조절하고 싶을 때
3. 커스텀 파서 작성할 때

## 결론
| 모드              | 데이터 전달 방식 | 자동 flow? | 언제 사용                   |
|-----------------|-----------|----------|-------------------------|
| **flowing**     | push      | O        | pipe, data 이벤트          |
| **non-flowing** | pull      | X        | 직접 read, 파싱 제어, 백프레셔 제어 |

# Node.js가 기본적으로 backpressure를 어떻게 처리하나?
Node.js 내부적으로 처리되고 있음.

파이프를 사용하는게 안전한 이유가 백프레셔 대응도 할 수 있음.

```js
readable.pipe(writable);
```

.pipe()는 내부적으로 pause/resume, drain 등을 이미 구현해둠.

그래서 .pipe()는 backpressure-safe.

## 이게 왜 중요한가?
NestJS + Redis + RDS로 대량 트래픽 처리하는 경우
1. S3 → API로 파일 업로드
2. DB에서 대량 row 읽어서 Kafka로 push 
3. 요청에서 오는 데이터 스트림 처리
4. 데이터 ingest → batch write

이런 상황에서 읽기 속도와 쓰기 속도의 밸런스를 잘못 잡으면...
1. RAM 폭주
2. 이벤트 루프 block
3. GC pressure 
4. 컨테이너 재시작 
5. OOMKilled

이런 사고를 피하는 핵심 장치가 바로 backpressure임
