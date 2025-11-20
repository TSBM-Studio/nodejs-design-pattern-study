import {PassThrough, pipeline, Transform, Writable} from "node:stream";
import {promisify} from "node:util";

class MultiplexStream extends Transform {
    constructor() {
        super({ writableObjectMode: true });
        this._openChannels = 0;
    }

    _transform(chunk, encoding, callback) {
        const { channel, data } = chunk;
        const line = JSON.stringify({ channel, data }) + "\n";
        this.push(line);
        callback();
    }

    createChannel(channelName) {
        const parent = this;
        this._openChannels += 1;

        const w = new Writable({
            objectMode: true,
            write(data, enc, cb) {
                parent.write({ channel: channelName, data });
                cb();
            },
        });

        // 이 채널이 끝나면 openChannels를 줄이고, 다 끝났으면 mux.end()
        w.on("finish", () => {
            parent._openChannels -= 1;
            if (parent._openChannels === 0) {
                parent.end(); // 이게 pipeline의 첫 스트림 종료 → demux 입력 종료로 이어짐
            }
        });

        return w;
    }
}

class DemultiplexStream extends Transform {
    constructor() {
        super();
        this._buffer = "";
        this.channels = new Map();
    }

    createChannel(channelName) {
        const ch = new PassThrough({ objectMode: true });
        this.channels.set(channelName, ch);
        return ch;
    }

    _transform(chunk, encoding, callback) {
        this._buffer += chunk.toString();

        let index;
        while ((index = this._buffer.indexOf("\n")) >= 0) {
            const line = this._buffer.slice(0, index);
            this._buffer = this._buffer.slice(index + 1);

            if (!line.trim()) continue;

            let msg;
            try {
                msg = JSON.parse(line);
            } catch (err) {
                this.emit("error", new Error("Invalid JSON line: " + line));
                continue;
            }

            const { channel, data } = msg;
            const ch = this.channels.get(channel);
            if (ch) ch.write(data);
        }

        callback();
    }

    _final(callback) {
        // 입력이 끝났으니 모든 채널을 종료
        for (const ch of this.channels.values()) {
            ch.end();
        }
        callback();
    }
}

const pipe = promisify(pipeline);

async function main() {
    const mux = new MultiplexStream();
    const demux = new DemultiplexStream();

    // 논리 채널 두 개
    const chA = mux.createChannel("A");
    const chB = mux.createChannel("B");

    // demux 쪽에서 대응되는 채널 Readable
    const readA = demux.createChannel("A");
    const readB = demux.createChannel("B");

    // 실제로는 mux와 demux 사이에 TCP 소켓, 파일, HTTP 응답 등이 올 수 있음
    // 여기선 그냥 메모리 스트림으로 직접 연결
    pipe(mux, demux).catch((err) => {
        console.error("PIPE ERROR:", err);
    });

    // A 채널 소비자
    readA.on("data", (data) => {
        console.log("[A]", data);
    });
    readA.on("end", () => {
        console.log("[A] END");
    });

    // B 채널 소비자
    readB.on("data", (data) => {
        console.log("[B]", data);
    });
    readB.on("end", () => {
        console.log("[B] END");
    });

    // === 여기서부터는 논리 채널에다가 그냥 write만 하면 됨 ===
    chA.write("hello");
    chB.write({ type: "event", payload: 1 });
    chA.write("world");
    chB.write({ type: "event", payload: 2 });

    chA.end();
    chB.end();
}

main().catch(console.error);
