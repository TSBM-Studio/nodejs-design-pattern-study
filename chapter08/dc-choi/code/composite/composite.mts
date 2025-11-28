// make composite pattern
// this is typescript code
// and i want tree structure like below
// root => middle => leaf

abstract class Component {
    protected name: string;
    protected depth: number;

    constructor(name: string, depth: number) {
        this.name = name;
        this.depth = depth;
    }

    abstract add(component: Component): void;
    abstract remove(component: Component): void;
    abstract display(depth: number): void;
}

class Leaf extends Component {
    add(component: Component): void {
        console.log("Cannot add to a leaf");
    }

    remove(component: Component): void {
        console.log("Cannot remove from a leaf");
    }

    display(): void {
        // @ts-ignore
        console.log("-".repeat(this.depth) + this.name);
    }
}

class Composite extends Component {
    private children: Component[] = [];

    add(component: Component): void {
        this.children.push(component);
    }

    remove(component: Component): void {
        const index = this.children.indexOf(component);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    }

    display(): void {
        // @ts-ignore
        console.log("-".repeat(this.depth) + this.name);
        for (const child of this.children) {
            child.display(this.depth + 2);
        }
    }
}

// Usage
const root = new Composite("root", 0);
const middle1 = new Composite("middle1", 2);
const middle2 = new Composite("middle2", 2);
const leaf1 = new Leaf("leaf1", 4);
const leaf2 = new Leaf("leaf2", 4);
const leaf3 = new Leaf("leaf3", 4);
const leaf4 = new Leaf("leaf4", 4);

middle1.add(leaf1);
middle1.add(leaf2);
middle2.add(leaf3);
middle2.add(leaf4);
root.add(middle1);
root.add(middle2);

root.display();