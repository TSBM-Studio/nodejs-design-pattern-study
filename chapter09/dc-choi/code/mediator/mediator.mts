// 중재자 패턴 ts 구현 예제

type Colleague = {
    receiveMessage: (message: string, from: Colleague) => void;
    sendMessage: (message: string) => void;
};

class ConcreteColleague implements Colleague {
    private mediator: Mediator;
    private name: string;

    constructor(name: string, mediator: Mediator) {
        this.name = name;
        this.mediator = mediator;
        this.mediator.register(this);
    }

    receiveMessage(message: string, from: Colleague): void {
        console.log(`${this.name} received message: "${message}" from ${(<ConcreteColleague>from).name}`);
    }

    sendMessage(message: string): void {
        console.log(`${this.name} is sending message: "${message}"`);
        this.mediator.sendMessage(message, this);
    }
}

interface Mediator {
    register(colleague: Colleague): void;
    sendMessage(message: string, from: Colleague): void;
}

class ConcreteMediator implements Mediator {
    private colleagues: Colleague[] = [];

    register(colleague: Colleague): void {
        this.colleagues.push(colleague);
    }

    sendMessage(message: string, from: Colleague): void {
        for (const colleague of this.colleagues) {
            if (colleague !== from) {
                colleague.receiveMessage(message, from);
            }
        }
    }
}

// 사용 예제
const mediator = new ConcreteMediator();

const colleague1 = new ConcreteColleague("Colleague1", mediator);
const colleague2 = new ConcreteColleague("Colleague2", mediator);
const colleague3 = new ConcreteColleague("Colleague3", mediator);

colleague1.sendMessage("Hello, everyone!");
colleague2.sendMessage("Hi, Colleague1!");
colleague3.sendMessage("Good to see you all!");