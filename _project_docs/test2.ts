import handler from './api/scrape';

const req = { method: 'POST', body: { url: 'https://zahraah.com/ar/products/18290/bntlon-rsmy-aaaly-alkhsr-bt0286bk' }, headers: { 'x-forwarded-for': '127.0.0.1' } } as any;
const res = { 
  status: (code: any) => ({ json: (data: any) => console.log('STATUS:', code, data) }),
  setHeader: () => {}
} as any;

handler(req, res).catch(console.error);
