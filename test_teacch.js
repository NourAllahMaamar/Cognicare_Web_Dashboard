const https = require('https');

async function testApi() {
  try {
    // 1. Login
    const loginData = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'cognicare-mobile-h4ct.onrender.com',
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

    if (!loginData.accessToken) {
        console.log('Login failed', loginData);
        return;
    }
    const token = loginData.accessToken;

    // 2. Fetch children to get a childId
    const childrenRes = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'cognicare-mobile-h4ct.onrender.com',
        path: '/api/v1/organization/my-organization/children',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(JSON.parse(body)));
      });
      req.on('error', reject);
      req.end();
    });
    
    if (!childrenRes || childrenRes.length === 0) {
        console.log('No children found');
        return;
    }
    const childId = childrenRes[0]._id;
    console.log('Testing TEACCH creation for child:', childrenRes[0].fullName);

    // 3. Create TEACCH Plan
    const planData = {
        childId,
        type: 'TEACCH',
        title: 'Test TEACCH Tracker',
        content: {
            goals: [{
                id: '123',
                text: 'Will complete puzzle independently',
                category: 'social_skills',
                categoryLabel: 'Social Skills',
                baseline: 10,
                target: 90,
                current: 10,
                measurement: 'Percentage of successful trials'
            }],
            workSystem: {
                whatToDo: 'Puzzle',
                howMuch: '1',
                whenDone: 'Finished',
                whatNext: 'Play'
            },
            categories: ['social_skills']
        }
    };

    const createRes = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'cognicare-mobile-h4ct.onrender.com',
        path: '/api/v1/specialized-plans',
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', reject);
      req.write(JSON.stringify(planData));
      req.end();
    });

    console.log('Create TEACCH Response:', createRes.status, createRes.body);

  } catch (err) {
    console.error(err);
  }
}
testApi();
