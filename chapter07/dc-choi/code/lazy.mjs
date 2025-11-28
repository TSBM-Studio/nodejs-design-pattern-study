class HeavyService {
    constructor(config) {
        console.log("HeavyService 생성자 실행!");
        // 대충 무거운 초기화...
        this.config = config;
    }

    doWork() {
        console.log("일하는 중...", this.config);
    }
}

// 프록시를 사용한 지연 초기화
const createLazyHeavyService = (config) => {
    let instance = null;

    return new Proxy({}, {
        get(_, prop) {
            if (instance === null) {
                instance = new HeavyService(config);
            }
            return instance[prop];
        }
    });
}

// 실제 사용
const service = new HeavyService({ url: "https://example.com" });
console.log("서비스가 생성되었습니다.");
service.doWork();
console.log("==============================");
const lazyService = createLazyHeavyService({ url: "https://example.com" });
console.log("서비스가 생성되었지만, HeavyService는 아직 초기화되지 않았습니다.");
lazyService.doWork(); // 이 시점에서 HeavyService가 초기화됩니다.