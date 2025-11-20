import {Readable, Transform} from "node:stream";

/**
 * 입력은 병렬로 처리하지만 출력은 입력 순서를 보장하는 Transform 스트림
 *
 * @typedef {Object} OrderedParallelOptions
 * @property {number} [concurrency=8] 동시에 처리할 최대 개수
 * @property {(chunk: any) => Promise<any>} mapper chunk를 처리할 비동기 함수
 * @property {import("node:stream").TransformOptions} [transformOptions] 기타 Transform 옵션
 */
export class OrderedParallelTransform extends Transform {
    /**
     * @param {Object} options
     * @param {number} [options.concurrency=8]
     * @param {(chunk: any) => Promise<any>} options.mapper
     * @param {import("node:stream").TransformOptions} [rest]
     */
    constructor(options = {}) {
        const { concurrency = 8, mapper, ...rest } = options;

        if (typeof mapper !== "function") {
            throw new Error("OrderedParallelTransform: mapper function is required");
        }

        super({
            ...rest,
            objectMode: rest.objectMode ?? true,
        });

        this.concurrency = concurrency;
        this.mapper = mapper;

        // 현재 돌고 있는 비동기 작업 수
        this.active = 0;
        // 아직 시작 안 한 작업 큐
        this.queue = [];

        // 순서 유지를 위한 인덱스
        this.nextIndex = 0;    // 다음에 들어올 chunk의 index
        this.nextToPush = 0;   // 다음에 push 해야 할 index
        this.results = new Map(); // index -> { hasValue, value }

        // flush 제어
        this.flushing = false;
        this.flushCallback = null;
    }

    _transform(chunk, _encoding, callback) {
        const index = this.nextIndex++;
        // queue에 쌓고
        this.queue.push({ index, chunk, cb: callback });
        // 동시에 처리 가능한 만큼 작업 시작
        this.#maybeProcessNext();
    }

    #maybeProcessNext() {
        while (this.active < this.concurrency && this.queue.length > 0) {
            const { index, chunk, cb } = this.queue.shift();

            this.active += 1;

            // upstream에는 "이 chunk는 받았어" 라고 바로 알려줌
            cb();

            // 비동기 작업 실행
            Promise.resolve()
                .then(() => this.mapper(chunk))
                .then((result) => {
                    this.#storeResult(index, result);
                    this.#pushInOrderIfPossible();
                })
                .catch((err) => {
                    this.emit("error", err);
                })
                .finally(() => {
                    this.active -= 1;

                    if (this.flushing) {
                        this.#checkFlushDone();
                    } else {
                        this.#maybeProcessNext();
                    }
                });
        }
    }

    #storeResult(index, result) {
        // undefined/null 결과는 "skip" 하되 순서 카운트는 맞추기 위해 기록만 함
        const hasValue = result !== undefined && result !== null;
        this.results.set(index, { hasValue, value: result });
    }

    #pushInOrderIfPossible() {
        // nextToPush부터 시작해서, 결과가 준비된 순서대로 push
        while (this.results.has(this.nextToPush)) {
            const { hasValue, value } = this.results.get(this.nextToPush);
            this.results.delete(this.nextToPush);

            if (hasValue) {
                this.push(value);
            }

            this.nextToPush += 1;
        }

        if (this.flushing) {
            this.#checkFlushDone();
        }
    }

    #checkFlushDone() {
        if (
            this.flushing &&
            this.active === 0 &&
            this.queue.length === 0 &&
            this.results.size === 0
        ) {
            const cb = this.flushCallback;
            this.flushCallback = null;
            this.flushing = false;
            if (cb) cb();
        }
    }

    _flush(callback) {
        // 더 이상 새로운 chunk는 안 들어오고,
        // 현재 큐/active/results가 모두 비면 종료
        if (this.active === 0 && this.queue.length === 0 && this.results.size === 0) {
            callback();
        } else {
            this.flushing = true;
            this.flushCallback = callback;
            // 혹시 이미 조건이 맞는 상태일 수도 있으니 한 번 체크
            this.#checkFlushDone();
        }
    }
}

function arrayToStream(items) {
    return Readable.from(items, { objectMode: true });
}

const source = arrayToStream([1, 2, 3, 4, 5, 6, 7, 8, 9]);

const parallelOrdered = new OrderedParallelTransform({
    concurrency: 3, // 동시에 최대 3개까지 처리
    async mapper(n) {
        const delay = Math.floor(Math.random() * 1000); // 0~999ms 랜덤 딜레이
        await new Promise((res) => setTimeout(res, delay));
        return { input: n, output: n * n, delay };
    },
});

source
    .pipe(parallelOrdered)
    .on("data", (data) => {
        console.log("result:", data);
    })
    .on("end", () => {
        console.log("done");
    })
    .on("error", (err) => {
        console.error("stream error:", err);
    });
