// make composite pattern
// this is typescript code
// and i want tree structure like below
// root => middle => leaf
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
var Component = /** @class */ (function () {
    function Component(name, depth) {
        this.name = name;
        this.depth = depth;
    }
    return Component;
}());
var Leaf = /** @class */ (function (_super) {
    __extends(Leaf, _super);
    function Leaf() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Leaf.prototype.add = function (component) {
        console.log("Cannot add to a leaf");
    };
    Leaf.prototype.remove = function (component) {
        console.log("Cannot remove from a leaf");
    };
    Leaf.prototype.display = function () {
        // @ts-ignore
        console.log("-".repeat(this.depth) + this.name);
    };
    return Leaf;
}(Component));
var Composite = /** @class */ (function (_super) {
    __extends(Composite, _super);
    function Composite() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.children = [];
        return _this;
    }
    Composite.prototype.add = function (component) {
        this.children.push(component);
    };
    Composite.prototype.remove = function (component) {
        var index = this.children.indexOf(component);
        if (index !== -1) {
            this.children.splice(index, 1);
        }
    };
    Composite.prototype.display = function () {
        // @ts-ignore
        console.log("-".repeat(this.depth) + this.name);
        for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
            var child = _a[_i];
            child.display(this.depth + 2);
        }
    };
    return Composite;
}(Component));
// Usage
var root = new Composite("root", 0);
var middle1 = new Composite("middle1", 2);
var middle2 = new Composite("middle2", 2);
var leaf1 = new Leaf("leaf1", 4);
var leaf2 = new Leaf("leaf2", 4);
var leaf3 = new Leaf("leaf3", 4);
var leaf4 = new Leaf("leaf4", 4);
middle1.add(leaf1);
middle1.add(leaf2);
middle2.add(leaf3);
middle2.add(leaf4);
root.add(middle1);
root.add(middle2);
root.display();
export {};
