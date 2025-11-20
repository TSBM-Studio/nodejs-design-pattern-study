import { Readable, Transform, Writable } from "node:stream";

// 예시용 Readable: 숫자 배열을 흘려보냄
const source = Readable.from([1, 2, 3, 4, 5], { objectMode: true });

// 브랜치 A: 2배 해서 출력
const branchA = new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
        cb(null, chunk * 2);
    },
});

// 브랜치 B: 제곱해서 출력
const branchB = new Transform({
    objectMode: true,
    transform(chunk, enc, cb) {
        cb(null, chunk * chunk);
    },
});

// 결과 소비자 A
const sinkA = new Writable({
    objectMode: true,
    write(chunk, enc, cb) {
        console.log("[A]", chunk);
        cb();
    },
});

// 결과 소비자 B
const sinkB = new Writable({
    objectMode: true,
    write(chunk, enc, cb) {
        console.log("[B]", chunk);
        cb();
    },
});

// 하나의 source를 두 갈래로 분기
source.pipe(branchA).pipe(sinkA);
source.pipe(branchB).pipe(sinkB);
