// 생성자를 사용해서 Writable 스트림 만들기
import { Writable } from 'node:stream';

class CustomWritable extends Writable {
    constructor() {
        super({
            decodeStrings: true, // 문자열 데이터를 버퍼로 디코딩
            defaultEncoding: 'utf8', // 기본 문자열 인코딩 설정
            objectMode: true, // 객체 모드 활성화
            highWaterMark: 16, // 내부 버퍼 크기 상한 (설정된 상한 이상의 데이터는 더 이상 읽지 않아야 함.)
            autoDestroy: true, // 스트림이 종료되면 자동으로 자원 정리
            emitClose: true, // 스트림 종료 시 'close' 이벤트 발생
            construct(callback) {
                // callback: 스트림이 준비되었음을 알리는 콜백 함수
                // 이 메서드는 스트림이 생성될 때 호출됩니다.
                callback();
            },
            write(chunk, encoding, callback) {
                // chunk: 쓰여질 데이터 청크
                // encoding: 청크의 인코딩 형식
                // callback: 쓰기 작업이 완료되었음을 알리는 콜백 함수
                // 이 메서드는 스트림에 데이터가 쓰여질 때 호출됩니다.
                console.log(`Writing chunk: ${chunk.toString()}`);
                callback(); // 쓰기 작업 완료 알림
            },
            final(callback) {
                // callback: 최종 작업이 완료되었음을 알리는 콜백 함수
                // 이 메서드는 스트림이 종료되기 전에 호출됩니다.
                console.log('Finalizing writable stream.');
                callback();
            },
            destroy(err, callback) {
                // err: 스트림을 파괴하는 원인이 된 오류 (없을 수도 있음)
                // callback: 파괴가 완료되었음을 알리는 콜백 함수
                // 이 메서드는 스트림이 더 이상 필요하지 않을 때 호출됩니다.
                // 리소스를 정리하고, 필요한 경우 오류를 처리한 후 callback을 호출해야 합니다.
                callback(err);
            },
        });
    }
}

const writable = new CustomWritable();
writable.write('Hello, World!', 'utf8', () => {
    console.log('Write completed.');
});
writable.end(() => {
    console.log('Stream ended.');
});
