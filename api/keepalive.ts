import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// This endpoint is meant to be pinged by UptimeRobot or cron-job.org
// It makes a lightweight query to Supabase to keep the free tier project active.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ status: 'error', message: 'Missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Make a tiny, lightweight query just to trigger activity
    const { data, error } = await supabase.from('categories').select('id').limit(1);

    if (error) {
      return res.status(500).json({ status: 'error', message: error.message });
    }

    return res.status(200).json({ 
      status: 'active', 
      message: 'Supabase project is awake and active!',
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
}
