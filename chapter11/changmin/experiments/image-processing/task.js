const { parentPort, workerData } = require("worker_threads");

// 시뮬레이션할 이미지 크기 (4K 해상도 정도)
const WIDTH = 3840;
const HEIGHT = 2160;

function processImage() {
  // 가상의 이미지 데이터 생성 (약 33MB)
  const buffer = Buffer.alloc(WIDTH * HEIGHT * 4);

  // 픽셀 조작 (CPU Intensive)
  // 단순한 반전(Invert) 작업이지만 픽셀 수가 많아 부하가 걸림
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] = 255 - buffer[i];
    // 추가 부하를 위해 약간의 수학 연산 추가
    Math.sqrt(i);
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
