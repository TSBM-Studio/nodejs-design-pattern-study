export class Matrix {
    private data: any;

    constructor (inMatrix) {
        this.data = inMatrix
    }

    * [Symbol.iterator] () {
        let nextRow = 0
        let nextCol = 0

        while (nextRow !== this.data.length) {
            yield this.data[nextRow][nextCol]
            if (nextCol === this.data[nextRow].length - 1) {
                nextRow++
                nextCol = 0
            } else {
                nextCol++
            }
        }
    }
}

const matrix = new Matrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

for (const value of matrix) {
    console.log(value)
}