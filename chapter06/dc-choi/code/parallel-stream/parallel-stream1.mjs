import { Readable, Transform } from "node:stream";

/**
 * 순서가 보장되지 않는 병렬 Transform 스트림
 *
 * @param {object} options
 * @param {number} [options.concurrency=8] 동시에 처리할 최대 개수
 * @param {(chunk: any) => Promise<any>} options.mapper chunk를 처리할 비동기 함수
 * @param {import("node:stream").TransformOptions} [rest] 나머지 Transform 옵션
 */
export class ParallelTransform extends Transform {
    constructor(options = {}) {
        const { concurrency = 8, mapper, ...rest } = options;

        if (typeof mapper !== "function") {
            throw new Error("ParallelTransform: mapper function is required");
        }

        super({
            ...rest,
            objectMode: rest.objectMode ?? true,
        });

        this.concurrency = concurrency;
        this.mapper = mapper;

        this.active = 0;
        this.queue = [];

        this.flushing = false;
        this.flushCallback = null;
    }

    _transform(chunk, _encoding, callback) {
        // 일단 큐에 쌓고
        this.queue.push({ chunk, cb: callback });
        // 처리 가능한지 확인
        this.#maybeProcessNext();
    }

    #maybeProcessNext() {
        while (this.active < this.concurrency && this.queue.length > 0) {
            const { chunk, cb } = this.queue.shift();

            this.active += 1;

            // upstream 에게는 "이 chunk는 받았어" 라고 바로 알려줌
            cb();

            // 비동기 작업 실행
            Promise.resolve()
                .then(() => this.mapper(chunk))
                .then((result) => {
                    // 먼저 끝난 작업부터 push → 순서 보장 안 됨
                    if (result !== undefined && result !== null) {
                        this.push(result);
                    }
                })
                .catch((err) => {
                    // 스트림 에러 이벤트
                    this.emit("error", err);
                })
                .finally(() => {
                    this.active -= 1;

                    if (this.flushing && this.active === 0 && this.queue.length === 0 && this.flushCallback) {
                        const fn = this.flushCallback;
                        this.flushCallback = null;
                        fn();
                    } else {
                        this.#maybeProcessNext();
                    }
                });
        }
    }

    _flush(callback) {
        // 더 이상 새로운 chunk는 안 들어오고,
        // active/queue 다 비면 종료
        if (this.active === 0 && this.queue.length === 0) {
            callback();
        } else {
            this.flushing = true;
            this.flushCallback = callback;
        }
    }
}

function arrayToStream(items) {
    return Readable.from(items, { objectMode: true });
}

const source = arrayToStream([1, 2, 3, 4, 5, 6, 7, 8, 9]);

const parallel = new ParallelTransform({
    concurrency: 3, // 동시에 최대 3개까지 비동기 작업 실행
    async mapper(n) {
        const delay = Math.floor(Math.random() * 1000); // 0~999ms 랜덤 딜레이
        await new Promise((res) => setTimeout(res, delay));
        return { input: n, output: n * n, delay };
    },
});

source
    .pipe(parallel)
    .on("data", (data) => {
        console.log("result:", data);
    })
    .on("end", () => {
        console.log("done");
    })
    .on("error", (err) => {
        console.error("stream error:", err);
    });