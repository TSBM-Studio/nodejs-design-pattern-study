var Inventory = /** @class */ (function () {
    function Inventory() {
    }
    Inventory.prototype.check = function () { console.log("재고 확인 중..."); };
    return Inventory;
}());
var Payment = /** @class */ (function () {
    function Payment() {
    }
    Payment.prototype.pay = function () { console.log("결제 중..."); };
    return Payment;
}());
var Point = /** @class */ (function () {
    function Point() {
    }
    Point.prototype.add = function () { console.log("포인트 적립 중..."); };
    return Point;
}());
var Delivery = /** @class */ (function () {
    function Delivery() {
    }
    Delivery.prototype.ship = function () { console.log("배송 정보 확인 중..."); };
    return Delivery;
}());
var Notification = /** @class */ (function () {
    function Notification() {
    }
    Notification.prototype.send = function () { console.log("주문 완료 알림 전송..."); };
    return Notification;
}());
var OrderFacade = /** @class */ (function () {
    function OrderFacade(inventory, pay, point, delivery, notify) {
        this.inventory = inventory;
        this.pay = pay;
        this.point = point;
        this.delivery = delivery;
        this.notify = notify;
    }
    OrderFacade.prototype.completeOrder = function () {
        this.inventory.check();
        this.pay.pay();
        this.point.add();
        this.delivery.ship();
        this.notify.send();
    };
    return OrderFacade;
}());
var inventory = new Inventory();
var payment = new Payment();
var point = new Point();
var delivery = new Delivery();
var notification = new Notification();
var orderFacade = new OrderFacade(inventory, payment, point, delivery, notification);
orderFacade.completeOrder();
export {};
