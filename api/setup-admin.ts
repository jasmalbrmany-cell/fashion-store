import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';

const SB_URL = process.env.VITE_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SETUP_TOKEN = 'FashionAdmin2024Setup';
const ADMIN_EMAIL = 'daoodalhashdi@gmail.com';
const ADMIN_PASSWORD = 'Admin@Fashion2024';

function sbRequest(path: string, method: string, body?: object): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const host = new URL(SB_URL).hostname;
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload).toString();

    const req = https.request({ hostname: host, port: 443, path, method, headers }, res => {
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(Buffer.from(c)));
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 200, data: JSON.parse(Buffer.concat(chunks).toString()) }); }
        catch { resolve({ status: res.statusCode ?? 200, data: Buffer.concat(chunks).toString() }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
    if (payload) req.write(payload);
    req.end();
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.query.token !== SETUP_TOKEN) {
    return res.status(403).json({ error: 'Forbidden — wrong token' });
  }
  if (!SB_URL || !SERVICE_KEY) {
    return res.status(500).json({
      error: 'Missing environment variables',
      has_VITE_SUPABASE_URL: !!SB_URL,
      has_SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY,
    });
  }

  // Step 1: Find user by email
  const list = await sbRequest(`/auth/v1/admin/users?page=1&per_page=100`, 'GET');
  if (list.status !== 200) {
    return res.status(500).json({ error: 'Cannot list users', supabase: list });
  }

  const existing = (list.data.users ?? []).find((u: any) => u.email === ADMIN_EMAIL);

  if (existing) {
    // Step 2a: Update existing user — reset password + confirm email + set admin role
    const upd = await sbRequest(`/auth/v1/admin/users/${existing.id}`, 'PUT', {
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'admin', provider: 'email' },
      user_metadata: { name: 'Admin' },
    });
    return res.status(200).json({
      action: 'updated_existing_user',
      success: upd.status === 200,
      supabase_status: upd.status,
      email: ADMIN_EMAIL,
      new_password: ADMIN_PASSWORD,
      note: 'Login with these credentials now',
    });
  } else {
    // Step 2b: Create new admin user
    const created = await sbRequest('/auth/v1/admin/users', 'POST', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      app_metadata: { role: 'admin', provider: 'email' },
      user_metadata: { name: 'Admin' },
    });
    return res.status(200).json({
      action: 'created_new_user',
      success: created.status === 200 || created.status === 201,
      supabase_status: created.status,
      email: ADMIN_EMAIL,
      new_password: ADMIN_PASSWORD,
      note: 'Login with these credentials now',
    });
  }
}
