export interface Command {
    execute(): void;
}

export class Light {
    turnOn() {
        console.log("Light is ON");
    }

    turnOff() {
        console.log("Light is OFF");
    }
}

export class LightOnCommand implements Command {
    private light: Light;

    constructor(light: Light) {
        this.light = light;
    }

    execute(): void {
        this.light.turnOn();
    }
}

export class LightOffCommand implements Command {
    private light: Light;

    constructor(light: Light) {
        this.light = light;
    }

    execute(): void {
        this.light.turnOff();
    }
}

export class RemoteControl {
    private command: Command | null = null;

    setCommand(command: Command): void {
        this.command = command;
    }

    pressButton(): void {
        if (this.command) {
            this.command.execute();
        } else {
            console.log("No command set");
        }
    }
}

// Usage example
const light = new Light();
const lightOnCommand = new LightOnCommand(light);
const lightOffCommand = new LightOffCommand(light);

const remote = new RemoteControl();

remote.setCommand(lightOnCommand);
remote.pressButton(); // Output: Light is ON

remote.setCommand(lightOffCommand);
remote.pressButton(); // Output: Light is OFF