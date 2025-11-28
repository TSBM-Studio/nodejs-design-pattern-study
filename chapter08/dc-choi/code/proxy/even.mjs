const even = new Proxy([], {
    get: (target, index) => index * 2,
    has: (target, number) => number % 2 === 0
});

console.log(even[1]); // 2
console.log(even[2]); // 4
console.log(even[3]); // 6
console.log(even[4]); // 8

console.log(1 in even); // false
console.log(2 in even); // true