import { EventEmitter } from 'events';

// 함수 호출시 즉시 tick 이벤트를 생성하도록 3.2.js 를 수정하세요

function Timer(number, callback) {
    const emitter = new EventEmitter();
    let count = 0;

    // 이거 안됨
    // Timer함수가 emitter를 반환하기 전에 이벤트가 발생하므로 
    // timer.on가 등록되기전에 이벤트가 발생함 (놓침)
    // emitter.emit('tick');

    const tickInterval = setInterval(() => {
        emitter.emit('tick');
        count++;
    }, 50);


    process.nextTick(() => {
        emitter.emit('tick');
        count++;
    });

    // "즉시"는 아님
    // setImmediate(() => {
    //     emitter.emit('tick');
    //     count++;
    // });

    // number 밀리초 후에 interval을 멈추고 callback 호출
    setTimeout(() => {
        clearInterval(tickInterval);
        callback(count);
    }, number);

    return emitter;
}   

const timer = Timer(500, (count) => {
    console.log(`총 ${count}번 tick 발생`);
});

timer.on('tick', () => console.log('tick 발생!'));