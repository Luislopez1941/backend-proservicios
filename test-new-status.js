const axios = require('axios');

async function testNewProposalStatus() {
  try {
    const testData = {
      user_id: 1,
      issuer_id: 1,
      receiver_id: 2,
      title: "Test Job Proposal with New Status",
      description: "Testing the new proposal statuses",
      price_total: 200000, // $2000.00 in cents
      currency: "MXN",
      accepts_payment_methods: ["cash", "card"],
      status: "payment_pending" // Using one of the new statuses
    };

    console.log('Testing job proposal creation with new status...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3002/job-proposal/create', testData);
    
    console.log('✅ Success! Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log('❌ Error Response:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testNewProposalStatus();

