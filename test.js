fetch('https://cognicare-mobile-h4ct.onrender.com/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'hsan.cheker@esprit.tn', password: 'cheker123' })
})
.then(res => res.json())
.then(data => {
  console.log("Token:", data.access_token ? "YES" : "NO");
  return fetch('https://cognicare-mobile-h4ct.onrender.com/api/v1/organization/my-organization/children', {
    headers: { 'Authorization': `Bearer ${data.access_token}` }
  });
})
.then(res => res.text())
.then(text => console.log("Children Response:", text))
.catch(err => console.error(err));
