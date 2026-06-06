const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env variables from .env
const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found at', envPath);
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars in .env:', { supabaseUrl, supabaseKey });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDemo() {
  const dealId = 4;
  console.log(`Starting Demo Payment Flow for Deal ID ${dealId} ("Rien de rien Deal")...\n`);

  try {
    // 1. Fetch Deal Info
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      console.error('Error fetching deal:', dealError?.message || 'Deal not found.');
      return;
    }

    console.log('Step 1: Current Deal State:');
    console.log(`- Name: ${deal.deal_name}`);
    console.log(`- Company: ${deal.company_name}`);
    console.log(`- Caller/Owner: ${deal.owner_caller_id || deal.caller_name}`);
    console.log(`- Current Stage: ${deal.stage}`);
    console.log(`- Setup Value: ${deal.setup_value} DZD`);
    console.log(`- Commission Rate: ${deal.commission_rate || 20}%\n`);

    const owner = deal.owner_caller_id || deal.caller_name || 'Hamid';
    const rate = deal.commission_rate || 20.00;
    const amount = Number(deal.setup_value) || 40000;

    // 2. Create Pending Payment Record
    console.log('Step 2: Creating expected deposit payment of ' + amount + ' DZD...');
    const { data: payment, error: payError } = await supabase
      .from('payments')
      .insert({
        deal_id: dealId,
        amount_expected: amount,
        payment_type: 'deposit',
        payment_method: 'BaridiMob',
        status: 'Pending'
      })
      .select()
      .single();

    if (payError) {
      console.error('Failed to create payment record:', payError.message);
      return;
    }
    console.log(`- Created Payment ID: ${payment.id} (Status: Pending)\n`);

    // 3. Confirm Payment and Trigger Automation
    console.log('Step 3: Confirming payment and calculating commission...');
    const nowStr = new Date().toISOString();
    
    // Update payment to Confirmed
    const { error: confirmError } = await supabase
      .from('payments')
      .update({
        amount_received: amount,
        status: 'Confirmed',
        confirmed_by: 'SYSTEM_DEMO',
        paid_at: nowStr
      })
      .eq('id', payment.id);

    if (confirmError) {
      console.error('Failed to confirm payment:', confirmError.message);
      return;
    }
    console.log('- Payment marked as Confirmed.');

    // Calculate commission
    const commissionAmt = (amount * rate) / 100;
    
    // Create commission record
    const { data: commission, error: commError } = await supabase
      .from('commissions')
      .insert({
        caller_id: owner,
        deal_id: dealId,
        payment_id: payment.id,
        commission_rate: rate,
        payment_amount: amount,
        commission_amount: commissionAmt,
        status: 'Pending Approval'
      })
      .select()
      .single();

    if (commError) {
      console.error('Failed to create commission:', commError.message);
      return;
    }
    console.log(`- Created Commission record ID: ${commission.id} (Amount: ${commissionAmt} DZD, Status: Pending Approval)`);

    // Promote Deal Stage
    const { error: stageError } = await supabase
      .from('deals')
      .update({
        stage: 'Won',
        payment_status: 'Deposit Paid',
        updated_at: nowStr
      })
      .eq('id', dealId);

    if (stageError) {
      console.error('Failed to update deal stage:', stageError.message);
      return;
    }
    console.log('- Deal stage promoted to "Won".');

    // Auto-create Project Record
    const { error: projError } = await supabase
      .from('projects')
      .insert({
        deal_id: dealId,
        package_type: deal.package_type || 'Starter',
        client_content_status: {
          logo: false,
          agency_name: true,
          phone: true,
          email: false,
          social_links: false,
          images: false
        },
        current_stage: 'Deposit Paid'
      });

    if (projError) {
      console.warn('Note: Could not auto-create project (it might already exist):', projError.message);
    } else {
      console.log('- Initialized Project Record under stage "Deposit Paid".');
    }

    // Insert audit log
    await supabase.from('audit_logs').insert({
      caller_name: 'SYSTEM_DEMO',
      action_type: 'CONFIRM_PAYMENT',
      details: `Payment of ${amount} DZD confirmed for deal ID ${dealId}. Commission of ${commissionAmt} DZD calculated for ${owner}.`,
      lead_id: null
    });

    console.log('\n==================================================');
    console.log('DEMO FLOW COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    console.log('\nWhat to verify in the Web App Dashboard:');
    console.log('1. Go to "Deal Pipeline" tab:');
    console.log('   - Verify that "Rien de rien Deal" has moved to the "Won" column.');
    console.log('2. Go to "Active Projects" tab:');
    console.log('   - Verify that a new project card for "Rien de rien Deal" is visible.');
    console.log('3. Go to "Commissions Ledger" tab:');
    console.log(`   - A new commission of ${commissionAmt.toLocaleString()} DZD is visible.`);
    console.log('   - Logged in as Hamid (Admin), you will see an "Approve" button.');
    console.log('   - Clicking "Approve" will change status to "Approved" and reveal "Pay Out".');
    console.log('   - Clicking "Pay Out" lets you finalize the payout with proof.');
  } catch (err) {
    console.error('Unexpected error during demo:', err);
  }
}

runDemo();
