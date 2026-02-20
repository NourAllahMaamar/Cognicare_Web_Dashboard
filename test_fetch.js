const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');

async function testFetch() {
  const loginRes = await fetch('https://cognicare-api.onrender.com/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'hsan.cheker@esprit.tn', password: 'cheker123' })
  });
  const loginData = await loginRes.json();
  console.log("Login Status:", loginRes.status);
  
  if (!loginData.access_token) {
    console.log("No access token. Body:", loginData);
    return;
  }
  
  console.log("Token:", loginData.access_token.substring(0, 20) + '...');
  
  const childrenRes = await fetch('https://cognicare-api.onrender.com/organization/my-organization/children', {
    headers: { 'Authorization': `Bearer ${loginData.access_token}` },
  });
  
  console.log("Children Status:", childrenRes.status);
  const childrenData = await childrenRes.text();
  console.log("Children Response:", childrenData);
}

testFetch();
