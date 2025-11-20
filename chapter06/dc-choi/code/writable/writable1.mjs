import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });

  // Write data to the response stream
  res.write('Hello, ');
  res.write('this is a writable stream example.\n');
  res.write('Goodbye!\n');

  // End the response
  res.end();
});
server.listen(8080, () => {
  console.log('Server is listening on http://localhost:8080');
});
