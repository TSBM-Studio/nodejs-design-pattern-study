---

## Appendix: 실제 성능 비교 실험

단일 Node.js 메인 스레드와 Worker Threads를 사용했을 때의 성능 차이를 확인하기 위해 간단한 실험을 수행함.

### 실험 환경

- **Task:** 4K 이미지(3840x2160) 버퍼를 생성하고 픽셀 반전 연산을 30회 반복 (CPU Intensive)
- **Scenario:** 4개의 작업을 동시에 요청
- **Metric:** 총 소요 시간 및 이벤트 루프 응답성(Heartbeat)

### 1. Blocking Mode (Main Thread)

```javascript
// 메인 스레드에서 순차 실행
tasks.forEach(() => processImage());
```

**결과:**

- **Total Time:** 3.384s
- **Event Loop:** **Dead (응답 없음)**
- **특징:** 작업이 진행되는 3.3초 동안 `setInterval`로 찍는 로그가 단 하나도 출력되지 않음. 서버가 완전히 멈춤.

### 2. Non-Blocking Mode (Worker Threads)

```javascript
// 워커 스레드로 위임
tasks.forEach(() => new Worker("./task.js"));
```

**결과:**

- **Total Time:** 0.895s (**약 3.8배 속도 향상**)
- **Event Loop:** **Alive (정상 작동)**
- **특징:** 작업 수행 중에도 `[Event Loop] Alive...` 로그가 0.1초마다 꾸준히 출력됨.

### 결론

Worker Threads를 사용하면 다중 코어를 활용하여 **처리 속도(Throughput)**를 획기적으로 높일 뿐만 아니라, 메인 스레드의 **응답성(Responsiveness)**을 유지하여 다른 클라이언트의 요청을 방해하지 않음.
