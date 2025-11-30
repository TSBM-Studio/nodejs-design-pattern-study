// 객체지향
interface PaymentStrategy {
    pay(amount: number): string;
}

class CardPaymentStrategy implements PaymentStrategy {
    pay(amount: number): string {
        return `카드로 ${amount}원 결제 완료`;
    }
}

class BankTransferStrategy implements PaymentStrategy {
    pay(amount: number): string {
        return `계좌이체로 ${amount}원 결제 완료`;
    }
}

class PointPaymentStrategy implements PaymentStrategy {
    pay(amount: number): string {
        return `포인트로 ${amount}원 결제 완료`;
    }
}

type PaymentType = 'card' | 'bank' | 'point';

class PaymentStrategyFactory {
    constructor(
        private readonly strategies: Record<PaymentType, PaymentStrategy>,
    ) {}

    getStrategy(type: PaymentType): PaymentStrategy {
        const strategy = this.strategies[type];
        if (!strategy) {
            throw new Error(`지원하지 않는 결제 방식입니다: ${type}`);
        }
        return strategy;
    }
}

export class PaymentService {
    constructor(private readonly strategyFactory: PaymentStrategyFactory) {}

    pay(type: PaymentType, amount: number): string {
        const strategy = this.strategyFactory.getStrategy(type);
        return strategy.pay(amount);
    }
}

class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    pay(type: PaymentType, amount: number): string {
        return this.paymentService.pay(type, amount);
    }
}

// 사용 예시
const nestFactory = () => {
    const cardStrategy = new CardPaymentStrategy();
    const bankStrategy = new BankTransferStrategy();
    const pointStrategy = new PointPaymentStrategy();

    const strategies: Record<PaymentType, PaymentStrategy> = {
        card: cardStrategy,
        bank: bankStrategy,
        point: pointStrategy,
    };

    const strategyFactory = new PaymentStrategyFactory(strategies);
    const paymentService = new PaymentService(strategyFactory);
    const paymentController = new PaymentController(paymentService);

    return { paymentController, paymentService, strategyFactory };
}

// 사용법
const paymentController = nestFactory().paymentController;
console.log(paymentController.pay('card', 10000));
console.log(paymentController.pay('bank', 20000));
console.log(paymentController.pay('point', 5000));