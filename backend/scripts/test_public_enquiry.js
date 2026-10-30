const axios = require('axios');

async function testPublicEnquiry() {
  try {
    const res = await axios.post('http://localhost:5000/api/enquiries/public', {
      child_name: 'Test Aarav Patil',
      parent_name: 'Suresh Patil',
      parent_phone: '9876543210',
      parent_email: 'suresh@test.com',
      child_age: 3,
      child_dob: '2023-05-15',
      class_interested: 'Nursery',
      remarks: 'Interested in morning batch with daycare facility.',
      lead_source: 'QR Code / Online Enquiry'
    });
    console.log('✅ Public Enquiry API Response:', res.status, res.data);
  } catch (err) {
    console.error('❌ Public Enquiry API Error:', err.response?.data || err.message);
  }
}

testPublicEnquiry();
