const createChangeObserver = (target, observer) => {
    return new Proxy(target, {
        set(obj, prop, value) {
            if (value !== obj[prop]) {
                const previousValue = obj[prop];
                obj[prop] = value;
                observer(prop, previousValue, value);
            }
            return true;
        }
    })
};

const calculateTotal = (invoice) => {
    return invoice.subtotal - invoice.discount + invoice.tax;
};

const invoice = {
    subtotal: 100,
    discount: 10,
    tax: 20,
};

let total = calculateTotal(invoice);
console.log(`초기 총액: ${total}`);

const observedInvoice = createChangeObserver(invoice, (prop, oldValue, newValue) => {
    total = calculateTotal(observedInvoice);
    console.log(`속성 "${prop}"가 ${oldValue}에서 ${newValue}(으)로 변경되었습니다. 새로운 총액: ${total}`);
});

// 속성 변경 시 총액이 자동으로 재계산됩니다.
observedInvoice.subtotal = 200; // subtotal 변경
observedInvoice.discount = 20;   // discount 변경
observedInvoice.tax = 30;        // tax 변경

console.log(`최종 총액: ${total}`);