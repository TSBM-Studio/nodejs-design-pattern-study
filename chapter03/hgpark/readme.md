# 콜백

## 콜백 패턴
콜백 = 리액터 패턴의 핸들러를 구현하는것
비동기 세계에서 콜백은 동기적으로 사용되는 return 명령의 사용을 대신함
JS는 함수가 일급 클래스 객체이고, 클로저를 통해 생성된 함수의 환경을 참조할 수 있어서 콜백에 이상적

### 연속 전달 방식
```js
// 동기식
function add(a, b, cbFunc) {
    cbFunc(a + b)
}

// 비동기식
function addAsync(a, b, cbFunc) {
    setTimeout(() => cbFunc(a + b), 100)
}
```

비동기식의 작업순서
```js
console.log('before')
addAsync(1,2, result => console.log(result))
console.log('after')

// before -> after -> 3
```
1. 초기 상태

Call Stack: [전역 실행 컨텍스트]
Callback Queue: []
Event Loop: 대기 중

2. console.log('before') 실행

Call Stack에 console.log('before') 푸시
즉시 실행되어 "before" 출력
Call Stack에서 Pop

3. addAsync(1, 2, callback) 호출

Call Stack에 addAsync 함수 푸시
addAsync 내부에서 비동기 작업(setTimeout, Promise 등) 시작
비동기 작업은 Web APIs나 백그라운드로 이동
addAsync 함수는 Call Stack에서 즉시 제거 (논블로킹)
콜백 함수는 아직 실행되지 않음

4. console.log('after') 실행

Call Stack에 console.log('after') 푸시
즉시 실행되어 "after" 출력
Call Stack에서 Pop

5. 비동기 작업 완료 후

백그라운드에서 addAsync의 비동기 작업 완료
콜백 함수 result => console.log(result)가 Callback Queue에 추가

6. Event Loop 동작

Call Stack이 비어있음을 Event Loop가 감지
Callback Queue에서 콜백 함수를 Call Stack으로 이동
콜백 함수 실행: console.log(3) → "3" 출력

"제어가 함수의 호출자로 돌아간다?"
함수 실행의 제어권이 함수를 호출한 곳으로 돌아간다는 의미
```js
// 동기 함수에서의 제어 반환
function add(a, b) {
    return a + b;  // 여기서 제어가 호출자로 반환
}

console.log('before');
let result = add(1, 2);  // add 함수가 완료될 때까지 기다림
console.log('after');    // add 함수 완료 후에 실행
```
제어 흐름:
1. add(1, 2) 호출 → 제어가 add 함수로 이동
2. add 함수 실행 완료 → 제어가 호출자(메인 스레드)로 반환
3. result에 값 할당 후 다음 줄 실행

```js
// 비동기 함수에서의 제어 반환
function addAsync(a, b, callback) {
    setTimeout(() => {
        callback(a + b);
    }, 0);
    // 여기서 즉시 제어가 호출자로 반환됨 (결과 기다리지 않음)
}

console.log('before');
addAsync(1, 2, result => console.log(result));  // 즉시 제어 반환
console.log('after');  // 바로 실행됨
```
제어 흐름:
1. addAsync(1, 2, callback) 호출 → 제어가 addAsync로 이동
2. setTimeout 설정 후 즉시 제어가 호출자로 반환
3. 비동기 작업은 백그라운드에서 계속 진행
4. 메인 스레드는 다음 코드(console.log('after')) 실행

비동기 함수는 호출자를 블록하지 않고 즉시 제어를 돌려주므로 Non-Blocking이다.

"비동기 작업은 완료되면 비동기 함수에 제공된 콜백에서부터 실행이 재개된다."
- callback Queue에서 실행되는게 진짜 작업

"실행은 이벤트 루프에서 시작되기 때문에 새로운 Call Stack을 가짐."

- callback 작업 전에 기존 함수는 callstack에서 제어권을 넘겨준뒤 pop됨. 
- callback을 실행하는 부분은 새로운 eventloop의 사이클임

"클로저 덕분에 콜백이 다른 시점과 다른 위치에서 호출되더라도 비동기 함수의 호출자 컨텍스트를 유지"

- 클로저는 함수 실행 시점의 렉시컬 스코프를 heap에 저장하는 것을 의미 (함수 자체가 null로 재할당 될때까지 유지된다.)

### 주의할점
하나의 함수에서 분기쳐서 동기, 비동기로 나누지 마라

만약 동기로 만들 수 없다면 deffered execution으로 비동기로 만들 수 도 있다.
process.nextTick()은 현재 진행중인 작업의 완료 시점 뒤로 함수의 실행 시간을 지연시킴 = 대기중인 I/O이벤트 대기열의 앞으로 밀어넣고 즉시 반환
현재 진행중인 작업이 제어를 이벤트루프로 넘기는 즉시 콜백이 실행됨

process.nextTick() vs setImmediate()
process.nextTick()
- 이미 예정된 I/O 보다 먼저 실행된다.
- 여기서 지연된 콜백은 Micro Task에 들어가므로 Macro Task (callback queue)의 작업보다 먼저 실행됨
- 대신, 이 콜백이 재귀면 I/O starvation 이 발생한다.

setImmediate()
- 이미 큐에 있는 I/O 뒤에 대기한다.
- setTimeout과의 차이점? 
    - setTimeout()은 한번 더 콜백이 들어가므로 이벤트 루프의 두단계 후에 실행된다.
    - setImmediate()은 현재 우리가 있는 바로 다음 단계에서 콜백이 실행됨


### Node.js 콜백 규칙
- 콜백은 함수의 가장 마지막 파라미터로
- 오류는 가장 먼저 처리한다.
- 오류 전파
    - 결과처럼 콜백을 사용해 오류를 전파
- 캐치되지 않는 예외
    - 비동기 콜백 내부에서 예외를 발생시키는 것은 예외가 이벤트 루프로 이동하게 만들어 다음 콜백으로 전파되지 않음. = node 종료됨
    - 예외가 콜백에서 스택으로 이동한 다음 이벤트루프로 이동하여 마지막으로 콘솔에서 포착되어 throw.
    - 이는 비동기 콜백을 try catch로 감싸서 호출하더라도 블록이 동작하는 스택과 콜백이 호출된 스택이 다르기 때문에 동작하지 않음.


## 관찰자 패턴
상태 변화가 일어날때 listner에게 통지할 수 있는 객체
콜백은 일반적으로 하나의 리스터에게 결과를 전달하지만, 관찰자 패턴은 여러 관찰자에게 통지할 수 있다.

### EventEmitter 클래스
on: 리스너 등록
once: 첫 이벤트가 전달된 후 제거되는 리스너 등록
emit: 새 이벤트를 생성하고, 리스너ㅇ게 전달할 인자를 제공
removeListner: 이벤트에 대한 리스너를 제거
모든 메서드는 EventEmitter 인스턴스를 반환

### 오류 전파
콜백과 마찬가지로 예외를 throw 할 수 없음. 
대신 error라는 이벤트를 발생시킴

### 관찰 가능한 객체 만들기
```js
class FindRegex extends EventEmitter {}
```

HTTP 모듈의 Server 객체의 EventEmitter 함수 속성은 request, connection, closed와 같은 이벤트를 생성하게끔 함

### 메모리 누수

EventEmitter은 어플리케이션 전체 주기동안 리스너들이 참조하는 모든 메모리를 유지하므로 리스너를 제거해줘야함. 
(once를 쓰더라도 이벤트가 발생하지 않으면 리스너가 해제되지 않음에 유의 필요)

### 동기, 비동기 이벤트
동일한 EventEmitter은 두 방법을 섞으면 안됨
이벤트가 비동기적으로 발생할 때, 현재의 스택이 이벤트 루프에 넘어갈 때 까지는 이벤트 발생을 만들어내는 작업 이후에도 새로운 리스너를 등록할 수 있다. (이벤트가 이벤트루프의 다음 사이클 까지 실행되지 않음을 보장하기 때문)
따라서 특정 메소드가 호출 된 후 비동기적으로 이벤트를 발생시킴

그러나, 작업이 실행된 이후에 이벤트를 동기적으로 발생시킨다면, 모든 리스너를 작업 실행 전에 등록해야함. (이후에 등록된 이벤트는 당연히 리스너를 호출하지 않음)

### EventEmitter, Callback
**EventEmitter vs Callback**
callback
- 결과가 비동기적으로 반환되어야 함
- 콜백의 인자로 타입을 전달하거나 여러개의 콜백을 취하여 차이를 둘 수 있지만, 깔끔한 API는 아님
- 정확히 한번만 호출되고, 단 하나의 리스너만 가짐

EventEmitter
- 발생한 사건과 연결될 때
- 같은 이벤트가 여러번 발생하거나 아예 발생하지 않을 수도 있는 경우
- 다수의 리스너가 필요함

**EventEmitter + Callback**

진행 결과를 알아야 하는 경우(다운로드, batch 등)

- 역할 분리
    - EventEmitter: 실시간 상태 변화, 진행 상황
    - Callback: 최종 결과, 즉시 응답