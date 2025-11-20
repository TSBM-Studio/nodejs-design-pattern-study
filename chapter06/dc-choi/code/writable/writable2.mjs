import { Writable } from 'node:stream';

class CustomWritable extends Writable {
    _write(chunk, encoding, callback) {
        console.log(`Writing chunk: ${chunk.toString()}`);
        // Simulate async operation
        setTimeout(() => {
            callback();
        }, 100);
    }
}

const writableStream = new CustomWritable();

writableStream.write('Hello, ');
writableStream.write('this is a custom writable stream.');
writableStream.end('Goodbye!', () => {
    console.log('All data has been written.');
});
