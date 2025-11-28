// 알림을 보내는 기능을 개발하려고 함.
// 알림에는 4가지 종류가 있음: 이메일, SMS, 카카오톡, 푸시 알림
// 기존에는 이메일, SMS, 카카오, 푸시 알림을 각각 한번씩만 보내면 되는데, 이제는 최대 4가지를 동시에 보내야 함.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Notifier = /** @class */ (function () {
    function Notifier() {
    }
    Notifier.prototype.send = function (message) { };
    return Notifier;
}());
var EmailNotifier = /** @class */ (function (_super) {
    __extends(EmailNotifier, _super);
    function EmailNotifier() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EmailNotifier.prototype.send = function (message) {
        console.log("Sending Email: ".concat(message));
    };
    return EmailNotifier;
}(Notifier));
var SMSNotifier = /** @class */ (function (_super) {
    __extends(SMSNotifier, _super);
    function SMSNotifier() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SMSNotifier.prototype.send = function (message) {
        console.log("Sending SMS: ".concat(message));
    };
    return SMSNotifier;
}(Notifier));
var KakaoNotifier = /** @class */ (function (_super) {
    __extends(KakaoNotifier, _super);
    function KakaoNotifier() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    KakaoNotifier.prototype.send = function (message) {
        console.log("Sending Kakao: ".concat(message));
    };
    return KakaoNotifier;
}(Notifier));
var PushNotifier = /** @class */ (function (_super) {
    __extends(PushNotifier, _super);
    function PushNotifier() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PushNotifier.prototype.send = function (message) {
        console.log("Sending Push: ".concat(message));
    };
    return PushNotifier;
}(Notifier));
// 데코레이터 클래스
var NotifierDecorator = /** @class */ (function (_super) {
    __extends(NotifierDecorator, _super);
    function NotifierDecorator(notifier) {
        var _this = _super.call(this) || this;
        _this.notifier = notifier;
        return _this;
    }
    NotifierDecorator.prototype.send = function (message) {
        this.notifier.send(message);
    };
    return NotifierDecorator;
}(Notifier));
var EmailDecorator = /** @class */ (function (_super) {
    __extends(EmailDecorator, _super);
    function EmailDecorator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    EmailDecorator.prototype.send = function (message) {
        _super.prototype.send.call(this, message);
        new EmailNotifier().send(message);
    };
    return EmailDecorator;
}(NotifierDecorator));
var SMSDecorator = /** @class */ (function (_super) {
    __extends(SMSDecorator, _super);
    function SMSDecorator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SMSDecorator.prototype.send = function (message) {
        _super.prototype.send.call(this, message);
        new SMSNotifier().send(message);
    };
    return SMSDecorator;
}(NotifierDecorator));
var KakaoDecorator = /** @class */ (function (_super) {
    __extends(KakaoDecorator, _super);
    function KakaoDecorator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    KakaoDecorator.prototype.send = function (message) {
        _super.prototype.send.call(this, message);
        new KakaoNotifier().send(message);
    };
    return KakaoDecorator;
}(NotifierDecorator));
var PushDecorator = /** @class */ (function (_super) {
    __extends(PushDecorator, _super);
    function PushDecorator() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PushDecorator.prototype.send = function (message) {
        _super.prototype.send.call(this, message);
        new PushNotifier().send(message);
    };
    return PushDecorator;
}(NotifierDecorator));
// 사용 예시
var notifier = new Notifier();
notifier = new EmailDecorator(notifier);
notifier = new SMSDecorator(notifier);
notifier = new KakaoDecorator(notifier);
notifier = new PushDecorator(notifier);
notifier.send("Hello, this is a test notification!");
export {};
// 출력:
// Sending Default: Hello, this is a test notification!
// Sending Email: Hello, this is a test notification!
// Sending SMS: Hello, this is a test notification!
// Sending Kakao: Hello, this is a test notification!
// Sending Push: Hello, this is a test notification!
