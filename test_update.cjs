require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testUpdate() {
  const { data, error } = await supabase.from('employee_accounts').select('id').limit(1);
  if (error) {
    console.error('Select Error:', error);
    return;
  }
  if (!data || data.length === 0) {
    console.log('No employee accounts found.');
    return;
  }
  const id = data[0].id;
  const { error: updateError } = await supabase.from('employee_accounts').update({ permissions: {} }).eq('id', id);
  if (updateError) {
    console.error('Update Error:', updateError);
  } else {
    console.log('Successfully updated permissions! Column exists or schema is dynamic.');
  }
}

testUpdate();
