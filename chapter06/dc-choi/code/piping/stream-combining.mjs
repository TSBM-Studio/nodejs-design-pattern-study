import { PassThrough, Transform, Duplex, pipeline } from "node:stream";
import { promisify } from "node:util";

const pipe = promisify(pipeline);

// 여러 스트림을 하나의 Duplex로 감싸기
const combineStreams = (...streams) => {
    const input = new PassThrough({ objectMode: true });   // 외부에서 쓰는 입구
    const output = new PassThrough({ objectMode: true });  // 외부에서 읽는 출구

    // input -> ...streams -> output 파이프라인 구성
    pipe(input, ...streams, output).catch((err) => {
        // pipeline 에러를 밖으로 전달
        duplex.emit("error", err);
    });

    // input / output을 감싸는 Duplex 생성
    const duplex = new Duplex({
        objectMode: true,

        // 외부에서 duplex.write(chunk) 하면 input으로 전달
        write(chunk, encoding, callback) {
            if (!input.write(chunk, encoding)) {
                // 백프레셔 처리
                input.once("drain", callback);
            } else {
                callback();
            }
        },

        // duplex.end() 호출 시 input 종료
        final(callback) {
            input.end();
            callback();
        },

        // 내부 output에서 데이터가 들어오면 push해서 readable로 노출
        read(size) {
            // 별도 구현 없이, output의 'data' 이벤트에서 push함
        }
    });

    // output -> duplex.readable 쪽으로 연결
    output.on("data", (chunk) => {
        if (!duplex.push(chunk)) {
            // 소비가 느리면 output 일시정지
            output.pause();
        }
    });
    // 소비자 쪽에서 다시 읽기 시작하면 output도 재개
    duplex.on("drain", () => {
        output.resume();
    });
    output.on("end", () => {
        duplex.push(null);
    });
    output.on("error", (err) => {
        duplex.emit("error", err);
    });

    return duplex;
};

// 예시 Transform 1: 대문자 변환
const toUpper = new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
        cb(null, String(chunk).toUpperCase());
    },
});

// 예시 Transform 2: "!!!" 붙이기
const append = new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
        cb(null, chunk + "!!!");
    },
});

const combined = combineStreams(toUpper, append);

combined.on("data", (data) => {
    console.log("OUTPUT:", data);
});

combined.on("error", (err) => {
    console.error("ERROR:", err);
});

combined.write("hello");
combined.write("world");
combined.end();
