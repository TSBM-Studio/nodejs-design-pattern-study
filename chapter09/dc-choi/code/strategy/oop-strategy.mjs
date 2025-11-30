var CardPaymentStrategy = /** @class */ (function () {
    function CardPaymentStrategy() {
    }
    CardPaymentStrategy.prototype.pay = function (amount) {
        return "\uCE74\uB4DC\uB85C ".concat(amount, "\uC6D0 \uACB0\uC81C \uC644\uB8CC");
    };
    return CardPaymentStrategy;
}());
var BankTransferStrategy = /** @class */ (function () {
    function BankTransferStrategy() {
    }
    BankTransferStrategy.prototype.pay = function (amount) {
        return "\uACC4\uC88C\uC774\uCCB4\uB85C ".concat(amount, "\uC6D0 \uACB0\uC81C \uC644\uB8CC");
    };
    return BankTransferStrategy;
}());
var PointPaymentStrategy = /** @class */ (function () {
    function PointPaymentStrategy() {
    }
    PointPaymentStrategy.prototype.pay = function (amount) {
        return "\uD3EC\uC778\uD2B8\uB85C ".concat(amount, "\uC6D0 \uACB0\uC81C \uC644\uB8CC");
    };
    return PointPaymentStrategy;
}());
var PaymentStrategyFactory = /** @class */ (function () {
    function PaymentStrategyFactory(strategies) {
        this.strategies = strategies;
    }
    PaymentStrategyFactory.prototype.getStrategy = function (type) {
        var strategy = this.strategies[type];
        if (!strategy) {
            throw new Error("\uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uACB0\uC81C \uBC29\uC2DD\uC785\uB2C8\uB2E4: ".concat(type));
        }
        return strategy;
    };
    return PaymentStrategyFactory;
}());
var PaymentService = /** @class */ (function () {
    function PaymentService(strategyFactory) {
        this.strategyFactory = strategyFactory;
    }
    PaymentService.prototype.pay = function (type, amount) {
        var strategy = this.strategyFactory.getStrategy(type);
        return strategy.pay(amount);
    };
    return PaymentService;
}());
export { PaymentService };
var PaymentController = /** @class */ (function () {
    function PaymentController(paymentService) {
        this.paymentService = paymentService;
    }
    PaymentController.prototype.pay = function (type, amount) {
        return this.paymentService.pay(type, amount);
    };
    return PaymentController;
}());
// 사용 예시
var nestFactory = function () {
    var cardStrategy = new CardPaymentStrategy();
    var bankStrategy = new BankTransferStrategy();
    var pointStrategy = new PointPaymentStrategy();
    var strategies = {
        card: cardStrategy,
        bank: bankStrategy,
        point: pointStrategy,
    };
    var strategyFactory = new PaymentStrategyFactory(strategies);
    var paymentService = new PaymentService(strategyFactory);
    var paymentController = new PaymentController(paymentService);
    return { paymentController: paymentController, paymentService: paymentService, strategyFactory: strategyFactory };
};
// 사용법
var paymentController = nestFactory().paymentController;
console.log(paymentController.pay('card', 10000));
console.log(paymentController.pay('bank', 20000));
console.log(paymentController.pay('point', 5000));
