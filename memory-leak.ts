
  // memory-leak.js
const leak = [];

setInterval(() => {
  leak.push(Buffer.alloc(10 * 1024 * 1024)); // 10MB
  console.log(`Leaked ${leak.length * 10} MB`);
}, 1000);
