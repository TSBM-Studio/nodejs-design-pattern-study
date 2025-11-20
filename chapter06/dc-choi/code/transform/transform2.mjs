// 생성자를 통한 Transform 만들기

import { Transform } from 'stream';

class UpperCaseTransform extends Transform {
    constructor() {
        super({
            allowHalfOpen: false, // 스트림이 끝난 후에도 읽기 또는 쓰기가 열려 있는지 여부 설정
            readableObjectMode: false, // 읽기 스트림이 객체 모드인지 여부 설정
            writableObjectMode: false, // 쓰기 스트림이 객체 모드인지 여부 설정
            readableHighWaterMark: 16 * 1024, // 읽기 버퍼의 최대 크기 설정
            writableHighWaterMark: 16 * 1024, // 쓰기 버퍼의 최대 크기 설정
            writableCorked: 0, // 쓰기 스트림이 코르크된 상태인지 여부 설정
            // 코르크: write() 호출 때마다 즉시 flush하지 않고, 일시적으로 버퍼에 모아뒀다가 한 번에 처리할 수 있게 하는 기능
            encoding: 'utf8', // 읽기 스트림의 기본 인코딩 설정
            decodeStrings: true, // 쓰기 스트림에서 문자열을 버퍼로 디코딩할지 여부 설정
            defaultEncoding: 'utf8', // 쓰기 스트림의 기본 인코딩 설정
            emitClose: true, // 스트림이 닫힐 때 'close' 이벤트를 방출할지 여부 설정
            objectMode: false, // 스트림이 객체 모드인지 여부 설정
            highWaterMark: 16 * 1024, // 읽기 및 쓰기 버퍼의 최대 크기 설정
            autoDestroy: true, // 스트림이 종료되면 자동으로 자원 해제 여부 설정
            construct(callback) {
                // 스트림이 생성될 때 필요한 초기화 작업 수행
                callback();
            },
            transform(chunk, encoding, callback) {
                const upperChunk = chunk.toString().toUpperCase();
                this.push(upperChunk);
                callback();
            },
            flush(callback) {
                // 스트림 종료 전에 필요한 정리 작업 수행
                callback();
            },
        })
    }
}

const upperCaseTransform = new UpperCaseTransform();
process.stdin.pipe(upperCaseTransform).pipe(process.stdout);