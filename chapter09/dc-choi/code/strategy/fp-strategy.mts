// 함수형
type PaymentStrategy = (amount: number) => string;

const cardPayment: PaymentStrategy = (amount) => {
    return `카드로 ${amount}원 결제 완료`;
};

const kakaoPayPayment: PaymentStrategy = (amount) => {
    return `카카오페이로 ${amount}원 결제 완료`;
};

const pointPayment: PaymentStrategy = (amount) => {
    return `포인트로 ${amount}원 결제 완료`;
};

// (typeof obj)[keyof typeof obj] → 객체 value 유니언 타입
// (typeof arr)[number] → 배열 요소 유니언 타입
const paymentTypeList = ['card', 'kakao', 'point'] as const;
type PaymentType = (typeof paymentTypeList)[number];

const getPaymentStrategy = (type: PaymentType): PaymentStrategy => {
    const strategies: Record<PaymentType, PaymentStrategy> = {
        card: cardPayment,
        kakao: kakaoPayPayment,
        point: pointPayment,
    };

    return strategies[type];
};

class PaymentService {
    pay(type: PaymentType, amount: number): string {
        const strategy = getPaymentStrategy(type);
        return strategy(amount);
    }
}

const parsePaymentType = (value: string): PaymentType => {
    // @ts-ignore // 왜 이거 안되지
    if (paymentTypeList.includes(value as PaymentType)) {
        return value as PaymentType;
    }

    throw new Error(
        `Invalid payment type. Must be one of: ${paymentTypeList.join(', ')}`,
    );
}

class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    pay(type: string, amount: string): string {
        const validatedType = parsePaymentType(type);
        const amountNumber = parseInt(amount, 10);
        return this.paymentService.pay(validatedType, amountNumber);
    }
}

// 사용 예시
const nestFactory = () => {
    const paymentService = new PaymentService();
    const paymentController = new PaymentController(paymentService);

    return { paymentController, paymentService };
}

// 사용법
const paymentController = nestFactory().paymentController;
console.log(paymentController.pay('card', '10000'));
console.log(paymentController.pay('kakao', '20000'));
console.log(paymentController.pay('point', '5000'));