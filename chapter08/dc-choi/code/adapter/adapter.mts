interface UsbDevice {
    type: 'A' | 'C';
    connect(): void;
}

class UsbADevice implements UsbDevice {
    type: 'A' = 'A';
    connect() {
        console.log("USB Type-A device connected.");
    }
}

class UsbCDevice implements UsbDevice {
    type: 'C' = 'C';
    connect() {
        console.log("USB Type-C device connected.");
    }
}

// USB a 타입과 USB c 타입을 연결해주는 어댑터 클래스
class UsbAdapter {
    private usbTypeDevice: UsbDevice;

    constructor(usbTypeDevice: UsbDevice) {
        this.usbTypeDevice = usbTypeDevice;
    }

    connectWithAdapter() {
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
    }
}

// 사용 예시
const aAdapter = new UsbAdapter(new UsbCDevice());
const cAdapter = new UsbAdapter(new UsbADevice());

// USB Type-A 포트에 연결
aAdapter.connectWithAdapter();

// USB Type-C 포트에 연결
cAdapter.connectWithAdapter();