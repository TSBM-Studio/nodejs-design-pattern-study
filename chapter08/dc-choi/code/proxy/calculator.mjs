class StackCalculator {
    constructor() {
        this.stack = [];
    }

    put(value) {
        this.stack.push(value);
    }

    get() {
        return this.stack.pop();
    }

    peekValue() {
        return this.stack[this.stack.length - 1];
    }

    clear() {
        this.stack = [];
    }

    divide() {
        const b = this.get();
        const a = this.get();
        const result = a / b;
        this.put(result);
        return result;
    }

    multiply() {
        const b = this.get();
        const a = this.get();
        const result = a * b;
        this.put(result);
        return result;
    }
}

const calculator = new StackCalculator();

const safeCalculator = new Proxy(calculator, {
    get(target, key) {
        if (key === 'divide') {
            return function () {
                const divisor = target.peekValue();
                if (divisor === 0) {
                    throw new Error('0으로 나눌 수 없습니다.');
                }
                return target.divide();
            };
        }

        return target[key];
    }
});

safeCalculator.clear();
safeCalculator.put(4);
// safeCalculator.put(0);
safeCalculator.put(1);
console.log(safeCalculator.divide());