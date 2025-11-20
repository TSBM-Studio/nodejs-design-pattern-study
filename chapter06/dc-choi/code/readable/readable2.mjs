import { Readable } from "node:stream";

const arr = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
    { id: 4, name: "Diana" },
    { id: 5, name: "Ethan" },
];

const arrStream = Readable.from(arr, {
    objectMode: true, // 객체 모드 활성화
});
arrStream.on("data", (chunk) => {
    console.log(chunk);
});
