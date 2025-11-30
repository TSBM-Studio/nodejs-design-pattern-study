type ReservationState = {
    confirm(): void;
    cancel(): void;
    delete(): void
};

class Reservation {
    private state: ReservationState;

    constructor() {
        this.state = new NewReservationState(this);
    }

    setState(state: ReservationState) {
        this.state = state;
    }

    confirm() {
        this.state.confirm();
    }

    cancel() {
        this.state.cancel();
    }

    delete() {
        this.state.delete();
    }
}

class NewReservationState implements ReservationState {
    constructor(private reservation: Reservation) {}

    confirm() {
        console.log("Reservation confirmed.");
        this.reservation.setState(new ConfirmedReservationState(this.reservation));
    }

    cancel() {
        throw new Error("Cannot cancel a new reservation.");
    }

    delete() {
        console.log("Reservation deleted.");
    }
}

class ConfirmedReservationState implements ReservationState {
    constructor(private reservation: Reservation) {}

    confirm() {
        throw new Error("Reservation is already confirmed.");
    }

    cancel() {
        console.log("Reservation canceled.");
        this.reservation.setState(new CanceledReservationState(this.reservation));
    }

    delete() {
        throw new Error("Cannot delete a confirmed reservation.");
    }
}

class CanceledReservationState implements ReservationState {
    constructor(private reservation: Reservation) {}

    confirm() {
        throw new Error("Cannot confirm a canceled reservation.");
    }

    cancel() {
        throw new Error("Reservation is already canceled.");
    }

    delete() {
        throw new Error("Cannot delete a canceled reservation.");
    }
}

// Usage example
const reservation = new Reservation();
reservation.confirm(); // Reservation confirmed.
reservation.cancel();  // Reservation canceled.
// reservation.delete(); // Error: Cannot delete a canceled reservation.