import { EventEmitter } from 'events';

// tick이 발생할 때 timestamp가 5로 나누어지면 에러를 생성하도록 함수를 수정하세요
// 콜백과 EventEmitter를 사용하여 에러를 전파하세요

function Timer(number, callback) {
    const emitter = new EventEmitter();
    let count = 0;

    const tickInterval = setInterval(() => {
        // timestamp가 5로 나누어지면 에러 발생
        if (Date.now() % 5 === 0) {
            clearInterval(tickInterval);
            clearTimeout(timer);
            const error = new Error('timestamp is divisible by 5');
            emitter.emit('error', error);  // EventEmitter로 에러 전파
            return callback(error, count);  // 콜백으로 에러 전파
        }
        
        emitter.emit('tick');
        count++;
    }, 50);

    process.nextTick(() => {
        emitter.emit('tick');
        count++;
    });

    const timer = setTimeout(() => {
        clearInterval(tickInterval);
        callback(null, count);  // 성공 시 null, count
    }, number);

    return emitter;
}   

const timer = Timer(5000, (err, count) => {
    if (err) {
        console.error(`에러 발생: ${err.message}`);
        console.log(`에러 발생 전까지 ${count}번 tick 발생`);
    } else {
        console.log(`총 ${count}번 tick 발생`);
    }
});

timer.on('tick', () => console.log('tick 발생!'));

// EventEmitter를 통한 에러 처리
timer.on('error', (err) => {
    console.error(`EventEmitter를 통한 에러 감지: ${err.message}`);
});