// 알림을 보내는 기능을 개발하려고 함.
// 알림에는 4가지 종류가 있음: 이메일, SMS, 카카오톡, 푸시 알림
// 기존에는 이메일, SMS, 카카오, 푸시 알림을 각각 한번씩만 보내면 되는데, 이제는 최대 4가지를 동시에 보내야 함.

class Notifier {
    send(message: string) {}
}

class EmailNotifier extends Notifier {
    send(message: string) {
        console.log(`Sending Email: ${message}`);
    }
}

class SMSNotifier extends Notifier {
    send(message: string) {
        console.log(`Sending SMS: ${message}`);
    }
}

class KakaoNotifier extends Notifier {
    send(message: string) {
        console.log(`Sending Kakao: ${message}`);
    }
}

class PushNotifier extends Notifier {
    send(message: string) {
        console.log(`Sending Push: ${message}`);
    }
}

// 데코레이터 클래스
class NotifierDecorator extends Notifier {
    private notifier: Notifier;

    constructor(notifier: Notifier) {
        super();
        this.notifier = notifier;
    }

    send(message: string) {
        this.notifier.send(message);
    }
}

class EmailDecorator extends NotifierDecorator {
    send(message: string) {
        super.send(message);
        new EmailNotifier().send(message);
    }
}

class SMSDecorator extends NotifierDecorator {
    send(message: string) {
        super.send(message);
        new SMSNotifier().send(message);
    }
}

class KakaoDecorator extends NotifierDecorator {
    send(message: string) {
        super.send(message);
        new KakaoNotifier().send(message);
    }
}

class PushDecorator extends NotifierDecorator {
    send(message: string) {
        super.send(message);
        new PushNotifier().send(message);
    }
}

// 사용 예시
let notifier = new Notifier();
notifier = new EmailDecorator(notifier);
notifier = new SMSDecorator(notifier);
notifier = new KakaoDecorator(notifier);
notifier = new PushDecorator(notifier);

notifier.send("Hello, this is a test notification!");
// 출력:
// Sending Default: Hello, this is a test notification!
// Sending Email: Hello, this is a test notification!
// Sending SMS: Hello, this is a test notification!
// Sending Kakao: Hello, this is a test notification!
// Sending Push: Hello, this is a test notification!