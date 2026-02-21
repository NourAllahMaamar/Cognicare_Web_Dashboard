#!/usr/bin/env node
/**
 * Test script to verify PECS, TEACCH, SkillTracker, and Activity plan creation
 * against the Render API. Run: node test_specialist_plans.js
 */
import https from 'https';

const API_BASE = 'cognicare-mobile-h4ct.onrender.com';
const CREDS = { email: 'hsan.cheker@esprit.tn', password: 'cheker123' };

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: API_BASE,
      path: `/api/v1${path}`,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('1. Logging in...');
  const loginRes = await request('POST', '/auth/login', CREDS);
  if (loginRes.status !== 201 && loginRes.status !== 200) {
    console.error('Login failed:', loginRes.status, loginRes.data);
    return;
  }
  const token = loginRes.data?.accessToken;
  if (!token) {
    console.error('No access token:', loginRes.data);
    return;
  }
  console.log('   OK');

  console.log('2. Fetching children...');
  const childrenRes = await request('GET', '/organization/my-organization/children', null, token);
  let children = [];
  if (childrenRes.status === 200 && Array.isArray(childrenRes.data)) {
    children = childrenRes.data;
  }
  const privateRes = await request('GET', '/children/specialist/my-children', null, token);
  if (privateRes.status === 200 && Array.isArray(privateRes.data)) {
    children = [...children, ...privateRes.data];
  }
  if (children.length === 0) {
    console.error('   No children found. Cannot test plan creation.');
    return;
  }
  const childId = children[0]._id;
  console.log(`   OK - using child: ${children[0].fullName} (${childId})`);

  const plans = [
    {
      name: 'PECS',
      body: {
        childId,
        type: 'PECS',
        title: 'Test PECS Board',
        content: {
          phase: 1,
          phaseName: 'Phase I – Physical Exchange',
          items: [{ id: '1', label: 'Apple', imageUrl: 'https://via.placeholder.com/120?text=Apple' }],
          trials: Array(10).fill(null),
          successCount: 0,
          isMastered: false,
          criteria: 'Test criteria',
        },
      },
    },
    {
      name: 'TEACCH',
      body: {
        childId,
        type: 'TEACCH',
        title: 'Test TEACCH Tracker',
        content: {
          goals: [{
            id: '1',
            text: 'Test goal',
            category: 'social_skills',
            categoryLabel: 'Social Skills',
            baseline: 10,
            target: 90,
            current: 10,
            measurement: 'Percentage',
          }],
          workSystem: { whatToDo: 'Puzzle', howMuch: '1', whenDone: 'Done', whatNext: 'Play' },
          categories: ['social_skills'],
        },
      },
    },
    {
      name: 'SkillTracker',
      body: {
        childId,
        type: 'SkillTracker',
        title: 'Test Skill Mastery',
        content: {
          subType: 'SkillTracker',
          description: 'Test skill',
          trials: Array(10).fill('pending'),
          isMastered: false,
          successCount: 0,
        },
      },
    },
    {
      name: 'Activity',
      body: {
        childId,
        type: 'Activity',
        title: 'Test Activity',
        content: { description: 'Test activity description', boardData: {} },
      },
    },
  ];

  for (const plan of plans) {
    console.log(`3. Creating ${plan.name} plan...`);
    const res = await request('POST', '/specialized-plans', plan.body, token);
    if (res.status === 201 || res.status === 200) {
      console.log(`   OK - created: ${res.data?._id || 'saved'}`);
    } else {
      console.error(`   FAIL - ${res.status}:`, res.data?.message || JSON.stringify(res.data));
    }
  }

  console.log('4. Fetching child plans...');
  const plansRes = await request('GET', `/specialized-plans/child/${childId}`, null, token);
  if (plansRes.status === 200 && Array.isArray(plansRes.data)) {
    console.log(`   OK - ${plansRes.data.length} plan(s) for child`);
  } else {
    console.log('   Response:', plansRes.status, plansRes.data);
  }

  console.log('5. Fetching my plans...');
  const myRes = await request('GET', '/specialized-plans/my-plans', null, token);
  if (myRes.status === 200 && Array.isArray(myRes.data)) {
    console.log(`   OK - ${myRes.data.length} total plan(s) by specialist`);
  }

  console.log('\nAll tests completed.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
