class Inventory { check() { console.log("재고 확인 중...") } }
class Payment { pay() { console.log("결제 중...") } }
class Point { add() { console.log("포인트 적립 중...") } }
class Delivery { ship() { console.log("배송 정보 확인 중...") } }
class Notification { send() { console.log("주문 완료 알림 전송...") } }

class OrderFacade {
    constructor(
        private inventory: Inventory,
        private pay: Payment,
        private point: Point,
        private delivery: Delivery,
        private notify: Notification,
    ) {}

    completeOrder() {
        this.inventory.check();
        this.pay.pay();
        this.point.add();
        this.delivery.ship();
        this.notify.send();
    }
}

const inventory = new Inventory();
const payment = new Payment();
const point = new Point();
const delivery = new Delivery();
const notification = new Notification();

const orderFacade = new OrderFacade(
    inventory,
    payment,
    point,
    delivery,
    notification,
);

orderFacade.completeOrder();