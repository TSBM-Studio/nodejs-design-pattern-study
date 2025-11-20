import { Readable, Writable } from "node:stream";

// Writable 하나 (모든 데이터가 여기로 모임)
const sink = new Writable({
    objectMode: true,
    write(chunk, enc, cb) {
        console.log("[SINK]", chunk);
        cb();
    }
});

// Readable 여러 개 준비
const r1 = Readable.from([1, 2, 3], { objectMode: true });
const r2 = Readable.from(["a", "b", "c"], { objectMode: true });
const r3 = Readable.from(["foo", "bar"], { objectMode: true });

// 여러 Readable을 하나의 sink로 파이핑
r1.pipe(sink, { end: false });
r2.pipe(sink, { end: false });
r3.pipe(sink, { end: true }); // 마지막 스트림만 end를 true로!
