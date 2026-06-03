const BACKEND_URL = 'http://127.0.0.1:8000';

async function runTests() {
  console.log('🏁 Starting Mobile API Integration Tests...');
  console.log(`🔌 Connecting to backend at: ${BACKEND_URL}`);

  let token = null;

  // 1. Test Login
  try {
    const params = new URLSearchParams();
    params.append('username', 'donor1@amal.org');
    params.append('password', 'donor123');

    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      throw new Error(`Login failed with status ${res.status}`);
    }

    const data = await res.json();
    token = data.data.access_token;
    console.log('✅ 1. Login successful! Received access token.');
  } catch (error) {
    console.error('❌ 1. Login failed:', error.message);
    process.exit(1);
  }

  // 2. Test Fetch Donor Profile
  try {
    const res = await fetch(`${BACKEND_URL}/api/donations/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Profile fetch failed with status ${res.status}`);
    }

    const json = await res.json();
    console.log('✅ 2. Fetch Donor Profile successful!');
    console.log('   Envelope structure valid:', json.success === true && 'data' in json);
    console.log(`   Donor Blood Type: ${json.data.blood_type}`);
    console.log(`   Availability Status: ${json.data.is_available}`);
  } catch (error) {
    console.error('❌ 2. Fetch profile failed:', error.message);
    process.exit(1);
  }

  // 3. Test Fetch Appointments
  try {
    const res = await fetch(`${BACKEND_URL}/api/donations/my-appointments`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Appointments fetch failed with status ${res.status}`);
    }

    const json = await res.json();
    console.log('✅ 3. Fetch Appointments successful!');
    console.log('   Response structure valid:', json.success === true && Array.isArray(json.data));
    console.log(`   Appointments count: ${json.data.length}`);
  } catch (error) {
    console.error('❌ 3. Fetch appointments failed:', error.message);
    process.exit(1);
  }

  console.log('🎉 All mobile API integration tests passed successfully!');
}

runTests();
