const { parentPort, workerData } = require("worker_threads");

// 시뮬레이션할 이미지 크기 (4K 해상도 정도)
const WIDTH = 3840;
const HEIGHT = 2160;

function processImage() {
  // 가상의 이미지 데이터 생성 (약 33MB)
  const buffer = Buffer.alloc(WIDTH * HEIGHT * 4);

  // 픽셀 조작 (CPU Intensive)
  // 부하를 늘리기 위해 여러 번 반복 수행 (예: 복잡한 필터링 시뮬레이션)
  const ITERATIONS = 30; // 30배 부하 증가

  for (let k = 0; k < ITERATIONS; k++) {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] = 255 - buffer[i];
    }
  }

  return `Processed ${WIDTH}x${HEIGHT} image`;
}

// 워커 스레드로 실행될 때
if (parentPort) {
  const result = processImage();
  parentPort.postMessage(result);
}

// 메인 스레드에서 직접 호출할 때 (블로킹 테스트용)
module.exports = processImage;
