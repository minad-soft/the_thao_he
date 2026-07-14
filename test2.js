const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching shifts...");
  const { data: shifts } = await supabase.from('shifts').select('id, shift_name, subject').ilike('shift_name', '%Lớp Nâng cao Chiều%').limit(1);
  if (!shifts || shifts.length === 0) {
    console.log("No shift found.");
    return;
  }
  const shiftId = shifts[0].id;
  console.log("Found shift:", shifts[0]);

  const { data: prefData } = await supabase.from('student_preferred_shifts').select('*').eq('shift_id', shiftId);
  console.log("student_preferred_shifts count:", prefData?.length);

  const { data: regPrefData } = await supabase.from('registrations').select('*').eq('shift_id', shiftId).eq('status', 'ACTIVE');
  console.log("registrations count:", regPrefData?.length);

  const studentIds = [...new Set([
    ...(prefData || []).map(p => p.student_id),
    ...(regPrefData || []).map(p => p.student_id)
  ].filter(Boolean))];
  console.log("Unique student Ids:", studentIds.length);

  const { data: students } = await supabase.from('students').select('id, full_name').in('id', studentIds);
  console.log("Students count:", students?.length);

  const { data: registrations } = await supabase.from('registrations').select('id, student_id, pricing_packages ( subject_id, subject )').in('student_id', studentIds);
  console.log("Registrations for these students:", registrations);
}

test();
