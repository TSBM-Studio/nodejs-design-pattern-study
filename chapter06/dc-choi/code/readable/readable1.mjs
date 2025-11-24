import { Readable } from 'node:stream'

/**
 * 생성자로 메서드를 정의하는 Readable 스트림 클래스
 */
class Counter extends Readable {
    constructor(limit) {
        super({
            encoding: 'utf8', // 문자열 인코딩 설정
            objectMode: true, // 객체 모드 활성화
            highWaterMark: 16, // 내부 버퍼 크기 상한 (설정된 상한 이상의 데이터는 더 이상 읽지 않아야 함.)
            autoDestroy: true, // 스트림이 종료되면 자동으로 자원 정리
            emitClose: true, // 스트림 종료 시 'close' 이벤트 발생
            construct(callback) {
                // callback: 스트림이 준비되었음을 알리는 콜백 함수
                // 이 메서드는 스트림이 생성될 때 호출됩니다.
                callback();
            },
            read(size) {
                // size: 권장 청크 크기 (바이트 단위)
                // 이 메서드는 스트림이 데이터를 필요로 할 때 호출됩니다.
                // 데이터를 읽어와서 this.push()를 통해 스트림에 푸시해야 합니다.
                if (this.count > this.limit) {
                    this.push(null) // 스트림의 끝을 알림
                } else {
                    const chunk = `Count: ${this.count}`
                    this.push(chunk) // 데이터를 스트림에 푸시
                    this.count += 1
                }
            },
            destroy(err, callback) {
                // err: 스트림을 파괴하는 원인이 된 오류 (없을 수도 있음)
                // callback: 파괴가 완료되었음을 알리는 콜백 함수
                // 이 메서드는 스트림이 더 이상 필요하지 않을 때 호출됩니다.
                // 리소스를 정리하고, 필요한 경우 오류를 처리한 후 callback을 호출해야 합니다.
                callback(err);
            },
        })
        this.limit = limit
        this.count = 1
    }
}

const counter = new Counter(5);
counter.on('data', (chunk) => {
    console.log(chunk.toString())
});