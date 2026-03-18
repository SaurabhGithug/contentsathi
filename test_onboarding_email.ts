
import * as dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

import { sendPaymentConfirmationEmail } from './src/lib/email';

async function testEmail() {
  console.log('📧 Sending Onboarding Test Email...');
  
  const testEmailAddr = 'dangalesaurabh1996@gmail.com';
  const result = await sendPaymentConfirmationEmail(
    testEmailAddr,
    'Onboarding Verified',
    '₹0 (Test)'
  );

  if (result.success) {
      console.log('✅ SUCCESS! Email sent to:', testEmailAddr);
  } else {
    console.error('❌ FAILED:', result.error);
  }
}

testEmail().catch(console.error);
