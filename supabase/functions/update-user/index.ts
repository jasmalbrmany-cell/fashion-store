import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user: requester } } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!requester) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single();

    if (!requesterProfile || requesterProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Only admins can update users' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { userId, name, phone, role, password, permissions } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update password if provided
    if (password) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    }

    // Update profile
    await supabaseAdmin.from('profiles').update({
      name, phone: phone || null, role: role || 'customer',
    }).eq('id', userId);

    // Update permissions
    if (permissions) {
      await supabaseAdmin.from('user_permissions').upsert({ user_id: userId, ...permissions });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
