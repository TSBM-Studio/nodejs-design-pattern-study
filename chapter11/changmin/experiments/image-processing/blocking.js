const processImage = require("./task");

console.log("--- [Blocking Mode] Start ---");

// 이벤트 루프 상태 모니터링
let ticks = 0;
const monitor = setInterval(() => {
  console.log(`[Event Loop] Alive... (tick: ${++ticks})`);
}, 100);

const startTime = Date.now();

// 4개의 작업을 "동시에" 요청한다고 가정 (하지만 메인 스레드라 순차 실행됨)
const tasks = [1, 2, 3, 4];

console.log(`[Main] Starting ${tasks.length} tasks...`);

// 동기적 실행 (Blocking)
tasks.forEach((id) => {
  console.log(`[Task ${id}] Started`);
  processImage(); // 여기서 메인 스레드가 멈춤!
  console.log(`[Task ${id}] Finished`);
});

const endTime = Date.now();
console.log(
  `--- [Blocking Mode] All Done in ${(endTime - startTime) / 1000}s ---`
);

clearInterval(monitor);
