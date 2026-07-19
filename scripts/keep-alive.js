const http = require('http');

function ping() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/keep-alive',
    method: 'GET',
    timeout: 10000
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const timestamp = new Date().toLocaleTimeString();
      if (res.statusCode === 200) {
        console.log(`[${timestamp}] ✅ Database awake`);
      } else {
        console.log(`[${timestamp}] ⚠️ Status: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (err) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ❌ Error: ${err.message}`);
  });

  req.on('timeout', () => {
    req.destroy();
    console.log(`[${new Date().toLocaleTimeString()}] ❌ Timeout`);
  });

  req.end();
}

// Ping every 3 minutes to keep Neon awake
ping();
setInterval(ping, 3 * 60 * 1000);

console.log('🔄 Keep-alive started - pinging every 3 minutes');