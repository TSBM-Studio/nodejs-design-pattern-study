const { Worker } = require("worker_threads");
const path = require("path");

console.log("--- [Non-Blocking Mode] Start ---");

// 이벤트 루프 상태 모니터링
let ticks = 0;
const monitor = setInterval(() => {
  console.log(`[Event Loop] Alive... (tick: ${++ticks})`);
}, 100);

const startTime = Date.now();

// 4개의 작업을 워커 스레드로 병렬 실행
const tasks = [1, 2, 3, 4];
let completed = 0;

console.log(`[Main] Starting ${tasks.length} tasks...`);

tasks.forEach((id) => {
  console.log(`[Task ${id}] Scheduling...`);

  const worker = new Worker(path.join(__dirname, "task.cjs"));

  worker.on("message", (msg) => {
    console.log(`[Task ${id}] Finished`);
    completed++;

    if (completed === tasks.length) {
      const endTime = Date.now();
      console.log(
        `--- [Non-Blocking Mode] All Done in ${
          (endTime - startTime) / 1000
        }s ---`
      );
      clearInterval(monitor);
    }
  });

  worker.on("error", console.error);
});
