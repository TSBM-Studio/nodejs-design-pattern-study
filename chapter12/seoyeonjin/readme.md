## [12.1 - 애플리케이션 확장 소개]

### 12.1.1 Node.js 애플리케이션 확장

1. 단일 스레드 컨텍스트 환경
   1. I/O 바인딩 작업이 대부분인 경우 이점을 갖는다.
   2. CPU 바인딩 작업이 대부분인 경우 취약하다. → 확장 필요
2. 확장의 장점
   1. 고가용성, 장애내성, 작업 부하 완화

### 12.1.2 확장성 3차원

> 확장성: 사용자가 많아져도 시스템이 버티며 성장할 수 있는 능력

1. 스케일 큐브

   1. x축 - 복제
      1. 동일한 서버를 여러 개 띄워서 로드밸런서를 앞에 둔다.
   2. y축 - 서비스/기능별 분해
      1. 인증 서버, 결제 서버, 상품 서버를 분리
   3. z축 - 데이터 파티션으로 분할

      1. 데이터를 나누는 방식 (같은 기능을 가진 서버가 데이터를 나누어 가진다)

→ 확장은 반드시 X축 → Y축 → Z축 순서로 단계적으로 고민한다.

## [12.2 - 복제 및 로드 밸런싱]

- 단일 스레드인 Node.js 애플리케이션은 일반적으로 기존 웹 서버에 비해 더 빨리 확장되어야 한다.
- 복제에 의한 Node.js 애플리케이션의 확장 작업은 비교적 간단하다.
- 확장을 위한 전제 조건은 각 인스턴스가 메모리나 디스크 같이 공유할 수 없는 리소스에 공통정보를 저장할 필요가 없다는 것이다.

### 12.2.1 클러스터 모듈

- 마스터 프로세스가 여러 개의 작업자 프로세스(worker)를 포크하여 생성하고 요청을 분배한다.
- 마**스터(master)**
  - 확장하려는 애플리케이션의 인스턴스를 각각 나타내는 여러 프로세스를 생성하는 역할.
  - 수신되는 각 연결은 복제된 작업에 분산되어 부하를 분산시킨다.
- 작업자(worker)
  - 실제로 HTTP 요청을 처리하는 Node.js 프로세스
- 로드밸런싱 방식
  - 대부분의 클러스터 모듈은 로드 밸런싱 알고리즘을 사용한다.
  - 기본적으로 `라운드 로빈 알고리즘`을 사용한다.
- 주의점
  - worker가 server.listern()을 호출하는 것이 아니라 마스터가 listen()을 대신 호출한다.
- 간단한 HTTP 서버 만들기 예제 - 프로세스 식별자가 포함된 메시지를 응답한다.

  - 클러스터 모듈 사용 X

    ```jsx
    import { createServer } from 'http'

    const {pid} = process
    const server = createServer(req,res) => {
      let i = 1e7;
      while (i >0) { i-- }

      console.log(`Handling request from ${pid}`)
      res.end('Hello from ${pid}\n`)
    })

    server.listen(8080, () => console.log(`Started at ${pid}`))
    ```

  - 클러스터 모듈 사용 O

    ```jsx
    import { createServer } from "http";
    import { cpus } from "os";
    import cluster from "cluster";

    if (cluster.isMaster) {
      const availableCpus = cpus();
      console.log(`Clustering to ${availableCpus.length} process`);
      availableCpus.forEach(() => cluster.fork());
    } else {
      const { pid } = process;
      const server = createServer((req, res) => {
        let i = 1e7;
        while (i > 0) {
          i--;
        }
        console.log(`Handling request from ${pid}`);
        res.end(`Hello from ${pid}\n`);
      });
      server.listen(8080, () => console.log(`Started at ${pid}`));
    }
    ```

  - 클러스터 모듈 사용 O + worker 충돌 처리
    - 특정 worker 가 죽어도, 마스터가 새 worker를 생성하고 서비스는 중단되지 않음
    ```jsx
    cluster.on("exit", (worker, code) => {
      if (code !== 0 && !worker.exitedAfterDisconnect) {
        console.log(
          `Worker ${worker.process.pid} crashed. Starting a new worker`
        );
        cluster.fork();
      }
    });
    ```
  - 클러스터 모듈 사용 O + 다운타임 제로 재시작
    - 운영 환경에서는 코드를 업데이트할 때 애플리케이션을 멈출 수 없다.
    - 그렇기 때문에 worker를 하나씩 종료하고 새 worker로 교체하는 방식이 필요하다.
    ```jsx
    import { once } from "events";
    // ...
    if (cluster.isMaster) {
      // ...
      process.on("SIGUSR2", async () => {
        const workers = Object.values(cluster.workers);
        for (const worker of workers) {
          console.log(`Stopping workers: ${worker.process.pid}`);
          worker.disconnect();
          await once(worker, "exit");
          if (!worker.exitedAfterDisconnect) continue;
          const newWorker = cluster.fork();
          await once(newWoker, "listening");
        }
      });
    } else {
      // ...
    }
    ```

### 12.2.2 상태 저장 통신 다루기

- 여러 인스턴스에 상태 공유: 데이터베이스 or 메모리 저장소에 상태 정보를 저장
  - 기존 방식에서 많은 리팩이 필요한 경우, 고정 로드 밸런싱(고정 세션)을 사용할 수 있다.
- 고정 로드 밸런시
  - 로드 밸런서가 세션과 관련된 모든 요청을 항상 동일한 애플리케이션 인스턴스로 라우팅하도록 한다.
  - 단점: 모든 인스턴스가 동일하지 않음. → 대체 불가능

### 12.2.3 역방향 프록시 확장

- 왜 역방향 프록시를 사용하는가?
  - 대규모 서버 환경에서는 클러스터보다 역방향 프록시가 선호된다.
    - 클러스터는 한 컴퓨터 안에서만 프로세스를 여러 개 띄운다.
    - 역방향 프록시는 여러 서버, 지역, 포트, 데이터센터까지 트래픽을 분산시킬 수 있다.
- 역방향 프록시를 주로 사용하는 솔루션
  - 1. Nginx
    - 가장 대중적
    - 비차단 I/O 기반
    - 고성능 reverse proxy
    - 로드밸런서 역할 강력함
  - 2. HAProxy
    - TCP/HTTP 트래픽 처리에 최적화
    - 대규모 서비스에서 많이 사용됨
  - 3. Node.js로 만든 Reverse Proxy
    - Node.js로 직접 로드밸런서를 만들 수도 있지만
    - 일반적으로 운영 환경에서 성능/안정성 부족
  - 4. 클라우드 로드밸런서
    - AWS ELB(ALB/NLB)
    - GCP Load Balancer
    - Cloudflare Load Balancer
- Nginx 로드밸런싱 예제

  ```jsx
  upstream my-load-balanced-app {
      server 127.0.0.1:8081;
      server 127.0.0.1:8082;
      server 127.0.0.1:8083;
      server 127.0.0.1:8084;
  }

  server {
      listen 8080;

      location / {
          proxy_pass http://my-load-balanced-app;
      }
  }
  ```

### 12.2.4 동적 수평 확장

- 개념
  - 애플리케이션 트래픽이 증가하면 자동으로 서버 인스턴스를 추가하고 트래픽이 적어지면 서버 인스턴스를 제거하여 비용을 절감하는 확장 방식.
  - 로드 밸런서는 현재 살아 있는 서버 목록을 항상 최신 상태로 알고 있어야 한다. 서버가 동적으로 생기고 죽어도, 라우팅이 정상적으로 이루어져야 한다.
  - 서비스 레지스트리는 애플리케이션 인스턴스 상태 정보를 관리한다.
- 서비스 레지스트리
  - 현재 실행 중인 모든 서비스의 주소, 포트, 상태를 등록/갱신/삭제하는 중앙 저장소
- http-proxy와 Consul을 사용한 동적 로드 밸런서 구현
  - 완전 동적 확장/축소 가능
  - 서비스별 트래픽 분리 가능
  - 코드에서 라운드 로빈, 가중치, 헬스체크 구현 가능

### 12.2.5 피어 투 피어 로드 밸런싱

- 기존 방식의 한계
  - 로드 밸런서라는 중앙 노드가 단일 병목이 됨
  - 모든 요청이 LB를 거치므로 지연 추가
- 피어 투 피어 로드 밸런싱이란?
  - 서비스 A가 직접 서비스 B 인스턴스 목록을 알고 있고, 그 중 하나를 선택해 직접 요청을 보냄
- 장점
  - 병목 지점 제거
  - 빠른 통신 가능
  - 무한 확장성
- 단점
  - 클라이언트가 인스턴스 목록을 받고 계속 업데이트해야 함
  - 클라이언트가 로드 밸런싱 알고리즘을 구현해야함
  - 인스턴스 health check 필요
- 비교
  - P2P LB가 좋은 경우
    - 내부 서비스 간 호출 (microservices 내부)
    - 높은 요청 빈도 → LB 부하 줄이고 싶을 때
    - latency가 중요한 서비스
    - 각 클라이언트가 충분히 똑똑해도 되는 경우
  - 중앙 집중식 LB가 좋은 경우
    - 외부 유저가 접속하는 public 엔드포인트
    - TLS 종료(Termination) 필요
    - WAF, DDOS 방어 필요
    - API Gateway 역할이 필요

### 12.2.6 컨테이너를 사용한 애플리케이션 확장

- 컨테이너란?
  - 코드와 모든 종속성을 패키지하하여 애플리케이션이 하나의 컴퓨팅 환경이 아닌 다른 컴퓨팅 환경에서도 빠르고 안정적으로 실행되도록 하는 소프트웨어의 표준 단위
- Docker 사용하기
  - 컨티이너 이미지 빌드
    - Dockefile 정의
  - 이미지에서 컨테이너 인스턴스 실행
- Kubernetes란?
  - 컨테이너 오케스트레이션 시스템
  - 컨테이너를 자동으로 배포, 확장, 롤아웃, 복구, 스케줄링하는 플랫폼

## [12.3 - 복잡한 애플리케이션 분해]

### 12.3.1 모놀리식 아키텍처

- 높은 결합 → 복잡성 측면에서 확장을 방해한다.

### 12.3.2 마이크로서비스 아키텍처

- 설게에서 중요한 것은 크기가 아니라, 느슨한 결합, 높은 응집력 및 통합 복잡성과 같은 결합이다.
- 데이터 소유권: 데이터베이스도 분리해야 한다.
- 장점
  - 충돌이 전체 시스템에 전파되지 않는다.
  - 쉽게 재사용할 수 있는 독립적인 단위를 만들 수 있다.
  - 확장 가능하다.
- 단점
  - 관리할 노드가 많을수록 통합, 배포, 코드 공유 복잡성이 증가한다.

### 12.3.3 마이크로서비스 아키텍처의 통합 패턴

- API 프록시 (API Gateway)
  - 여러 API 엔드포인트에 단일 액세스 포인트를 제공한다.
  - 로드밸런싱, 캐싱, 인증 및 트래픽 제한을 제공할 수 있다.
- API 오케스트레이션
  - 애플리케이션을 특정한 새로운 서비스를 구현하기 위해 비트들과 조각들을 연결하는 추상화를 만든다.
- 메시지 브로커와의 통합
  - 메시지 수신자로부터 발신자를 분리할 수 있는 시스템인 메시지 브로커를 사용하여 중앙 집중식의 발행/구독 패턴을 구현한다.
