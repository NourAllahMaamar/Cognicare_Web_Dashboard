const http = require('http');

async function testApi() {
  try {
    // 1. Login
    const loginData = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      });
      req.on('error', reject);
      req.write(JSON.stringify({ email: 'hsan.cheker@esprit.tn', password: 'cheker123' }));
      req.end();
    });

    console.log('Login Result:', loginData.user ? 'Success' : loginData);
    if (!loginData.accessToken) return;

    const token = loginData.accessToken;
    console.log('Role:', loginData.user.role);
    console.log('OrgId:', loginData.user.organizationId);

    // 2. Fetch org children
    const orgChildren = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/organization/my-organization/children',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.end();
    });
    console.log('\nOrg Children Response:', orgChildren.status, orgChildren.body);

    // 3. Fetch private children
    const privateChildren = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/children/specialist/my-children',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.end();
    });
    console.log('\nPrivate Children Response:', privateChildren.status, privateChildren.body);

  } catch (err) {
    console.error(err);
  }
}
testApi();
