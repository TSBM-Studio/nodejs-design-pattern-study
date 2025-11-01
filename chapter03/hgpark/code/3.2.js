import { EventEmitter } from 'events';

// number와 콜백을 인자로 받는 함수를 작성해보세요
// 이 함수는 호출되고 나서 number만큰의 밀리초가 지나기 전까지 매 50 밀리초마다 tick 이라는 이벤트를 내보내는 
// EventEmitter를 반환합니다.
// 또한 이 함수는 number만큼의 밀리초가 지났을때 tick이벤트가 일어난 횟수를 받는 callback을 호출합니다.

function Timer(number, callback) {
    const emitter = new EventEmitter();
    let count = 0;
    
    const tickInterval = setInterval(() => {
        emitter.emit('tick');
        count++;
    }, 50);

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