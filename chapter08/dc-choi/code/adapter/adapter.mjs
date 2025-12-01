var UsbADevice = /** @class */ (function () {
    function UsbADevice() {
        this.type = 'A';
    }
    UsbADevice.prototype.connect = function () {
        console.log("USB Type-A device connected.");
    };
    return UsbADevice;
}());
var UsbCDevice = /** @class */ (function () {
    function UsbCDevice() {
        this.type = 'C';
    }
    UsbCDevice.prototype.connect = function () {
        console.log("USB Type-C device connected.");
    };
    return UsbCDevice;
}());
// USB a 타입과 USB c 타입을 연결해주는 어댑터 클래스
var UsbAdapter = /** @class */ (function () {
    function UsbAdapter(usbTypeDevice) {
        this.usbTypeDevice = usbTypeDevice;
    }
    UsbAdapter.prototype.connectWithAdapter = function () {
        switch (this.usbTypeDevice.type) {
            case 'A':
                this.usbTypeDevice.connect();
                break;
            case 'C':
                this.usbTypeDevice.connect();
                break;
            default:
                throw new Error("Unsupported USB device type");
        }
    };
    return UsbAdapter;
}());
// 사용 예시
var aAdapter = new UsbAdapter(new UsbCDevice());
var cAdapter = new UsbAdapter(new UsbADevice());
// USB Type-A 포트에 연결
aAdapter.connectWithAdapter();
// USB Type-C 포트에 연결
cAdapter.connectWithAdapter();
export {};
