import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // 1. Get the first user
  const { data: users } = await supabase.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) return console.log('No users found.');
  const userId = users[0].id;

  // 2. Insert mock drafts
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 2); // 48 hours ago (OVERDUE)

  const mockDrafts = [
    {
      user_id: userId,
      platform: 'LinkedIn',
      hook_text: 'The biggest lie in Enterprise AI is that it saves you time.',
      body_text: 'The biggest lie in Enterprise AI is that it saves you time.\n\nIt doesn’t. It shifts your time from execution to orchestration.\n\nIn 2024, the leaders who win aren’t the ones replacing their teams with agents. They are the ones training their people to become Master Orchestrators.\n\nThe game has changed.',
      status: 'approved', // Needs Review
      editor_feedback: 'Excellent hook and stark phrasing. Completely devoid of AI jargon.',
      created_at: pastDate.toISOString(),
      updated_at: pastDate.toISOString() // Triggers the Overdue flag!
    },
    {
      user_id: userId,
      platform: 'LinkedIn',
      hook_text: 'Founders, stop building for the "modern" consumer.',
      body_text: 'Founders, stop building for the "modern" consumer.\n\nThey don’t exist. \n\nWhat exists is a highly fragmented spectrum of attention spans. Build for the friction. If your product takes more than 3 taps to deliver value, you’ve already lost.',
      status: 'approved',
      editor_feedback: 'Clear, concise, and provocative.',
    },
    {
      user_id: userId,
      platform: 'LinkedIn',
      hook_text: 'I just reviewed 50 SaaS pricing models.',
      body_text: 'I just reviewed 50 SaaS pricing models.\n\n90% of them are leaving millions on the table because they charge for features, not outcomes. Here is how to fix it...',
      status: 'scheduled',
    },
    {
      user_id: userId,
      platform: 'Newsletter',
      hook_text: 'The Hidden Cost of Scaling',
      body_text: 'Scaling breaks things. But it shouldn’t break your culture. Here is a 3-step framework to ensure you...',
      status: 'failed',
      editor_feedback: 'REJECTED: Sounded slightly robotic and used the banned word "navigate" twice.'
    }
  ];

  for (const d of mockDrafts) {
    await supabase.from('content_drafts').insert(d);
  }
  
  console.log('Successfully seeded mock data!');
}

run();
