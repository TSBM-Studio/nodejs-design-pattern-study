var cardPayment = function (amount) {
    return "\uCE74\uB4DC\uB85C ".concat(amount, "\uC6D0 \uACB0\uC81C \uC644\uB8CC");
};
var kakaoPayPayment = function (amount) {
    return "\uCE74\uCE74\uC624\uD398\uC774\uB85C ".concat(amount, "\uC6D0 \uACB0\uC81C \uC644\uB8CC");
};
var pointPayment = function (amount) {
    return "\uD3EC\uC778\uD2B8\uB85C ".concat(amount, "\uC6D0 \uACB0\uC81C \uC644\uB8CC");
};
// (typeof obj)[keyof typeof obj] → 객체 value 유니언 타입
// (typeof arr)[number] → 배열 요소 유니언 타입
var paymentTypeList = ['card', 'kakao', 'point'];
var getPaymentStrategy = function (type) {
    var strategies = {
        card: cardPayment,
        kakao: kakaoPayPayment,
        point: pointPayment,
    };
    return strategies[type];
};
var PaymentService = /** @class */ (function () {
    function PaymentService() {
    }
    PaymentService.prototype.pay = function (type, amount) {
        var strategy = getPaymentStrategy(type);
        return strategy(amount);
    };
    return PaymentService;
}());
var parsePaymentType = function (value) {
    // @ts-ignore // 왜 이거 안되지
    if (paymentTypeList.includes(value)) {
        return value;
    }
    throw new Error("Invalid payment type. Must be one of: ".concat(paymentTypeList.join(', ')));
};
var PaymentController = /** @class */ (function () {
    function PaymentController(paymentService) {
        this.paymentService = paymentService;
    }
    PaymentController.prototype.pay = function (type, amount) {
        var validatedType = parsePaymentType(type);
        var amountNumber = parseInt(amount, 10);
        return this.paymentService.pay(validatedType, amountNumber);
    };
    return PaymentController;
}());
// 사용 예시
var nestFactory = function () {
    var paymentService = new PaymentService();
    var paymentController = new PaymentController(paymentService);
    return { paymentController: paymentController, paymentService: paymentService };
};
// 사용법
var paymentController = nestFactory().paymentController;
console.log(paymentController.pay('card', '10000'));
console.log(paymentController.pay('kakao', '20000'));
console.log(paymentController.pay('point', '5000'));
export {};
