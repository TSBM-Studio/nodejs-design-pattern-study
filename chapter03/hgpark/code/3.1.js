import { EventEmitter } from 'events';
import { readFile } from 'fs';

// 입력 파일 리스트를 인자로 넘기고 find프로세스를 시작할 때 이벤트를 방출하게끔
// 비동기적 FindRegex클래스를 수정하세요
class FindRegex extends EventEmitter {
    constructor(regex) {
        super();
        this.regex = regex;
        this.files = [];
    }

    addFile(file) {
        this.files.push(file);
        return this;
    }

    find(files) {
        files.forEach(file => this.addFile(file));
        this.emit('ready');
        
        for(let file of this.files) {
            readFile(file, 'utf8', (err, content) => {
                if(err) {
                    return this.emit('error', err);
                }
                this.emit('fileread', file, content);

                const match = content.match(this.regex);
                
                if(match) {
                    match.forEach(elem => this.emit('found', file, elem));
                }
            })
        }

        return this;
    }
}

// 사용 예제
const findRegexInstance = new FindRegex(/hello \w+/g);

findRegexInstance
    .on('ready', () => console.log('검색 준비 완료'))
    .on('fileread', (file) => console.log(`${file} 파일을 읽었습니다`))
    .on('found', (file, match) => console.log(`매칭된 내용 "${match}" (파일: ${file})`))
    .on('error', (err) => console.error(`에러 발생: ${err.message}`));

// 테스트용 파일들을 검색
findRegexInstance.find(['test.txt']);