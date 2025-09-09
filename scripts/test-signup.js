const fetch = require('node-fetch');

async function testSignup() {
  try {
    console.log('🔄 Testing signup flow...');
    
    const response = await fetch('http://localhost:3003/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'signup',
        email: `testuser+${Date.now()}@example.com`,
        password: 'securepassword123',
        name: 'Test User Demo'
      })
    });

    const responseText = await response.text();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Headers:', Object.fromEntries(response.headers));
    console.log('📝 Response Body:', responseText);

    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Signup successful!');
      console.log('👤 User created:', data.user ? 'Yes' : 'No');
      console.log('📧 User ID:', data.user?.id);
      console.log('📧 User Email:', data.user?.email);
    } else {
      console.log('❌ Signup failed');
      try {
        const errorData = JSON.parse(responseText);
        console.log('🚨 Error:', errorData.error);
      } catch (e) {
        console.log('🚨 Raw error:', responseText);
      }
    }
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testSignup();

