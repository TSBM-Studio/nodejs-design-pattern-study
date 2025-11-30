var Reservation = /** @class */ (function () {
    function Reservation() {
        this.state = new NewReservationState(this);
    }
    Reservation.prototype.setState = function (state) {
        this.state = state;
    };
    Reservation.prototype.confirm = function () {
        this.state.confirm();
    };
    Reservation.prototype.cancel = function () {
        this.state.cancel();
    };
    Reservation.prototype.delete = function () {
        this.state.delete();
    };
    return Reservation;
}());
var NewReservationState = /** @class */ (function () {
    function NewReservationState(reservation) {
        this.reservation = reservation;
    }
    NewReservationState.prototype.confirm = function () {
        console.log("Reservation confirmed.");
        this.reservation.setState(new ConfirmedReservationState(this.reservation));
    };
    NewReservationState.prototype.cancel = function () {
        throw new Error("Cannot cancel a new reservation.");
    };
    NewReservationState.prototype.delete = function () {
        console.log("Reservation deleted.");
    };
    return NewReservationState;
}());
var ConfirmedReservationState = /** @class */ (function () {
    function ConfirmedReservationState(reservation) {
        this.reservation = reservation;
    }
    ConfirmedReservationState.prototype.confirm = function () {
        throw new Error("Reservation is already confirmed.");
    };
    ConfirmedReservationState.prototype.cancel = function () {
        console.log("Reservation canceled.");
        this.reservation.setState(new CanceledReservationState(this.reservation));
    };
    ConfirmedReservationState.prototype.delete = function () {
        throw new Error("Cannot delete a confirmed reservation.");
    };
    return ConfirmedReservationState;
}());
var CanceledReservationState = /** @class */ (function () {
    function CanceledReservationState(reservation) {
        this.reservation = reservation;
    }
    CanceledReservationState.prototype.confirm = function () {
        throw new Error("Cannot confirm a canceled reservation.");
    };
    CanceledReservationState.prototype.cancel = function () {
        throw new Error("Reservation is already canceled.");
    };
    CanceledReservationState.prototype.delete = function () {
        throw new Error("Cannot delete a canceled reservation.");
    };
    return CanceledReservationState;
}());
// Usage example
var reservation = new Reservation();
reservation.confirm(); // Reservation confirmed.
reservation.cancel(); // Reservation canceled.
export {};
// reservation.delete(); // Error: Cannot delete a canceled reservation.
