const A_CHAR_CODE = 65
const Z_CHAR_CODE = 90

const createAlphabetIterator = () => {
    let currCode = A_CHAR_CODE
    return {
        next () {
            const currChar = String.fromCodePoint(currCode)
            if (currCode > Z_CHAR_CODE) {
                return { done: true }
            }
            currCode++
            return { value: currChar, done: false }
        }
    }
}

const iterator = createAlphabetIterator();

let result = iterator.next();

while (!result.done) {
    console.log(result.value) // A, B, C, ..., Z
    result = iterator.next()
}