import handler from './api/scrape';

const req = { method: 'POST', body: { url: 'https://ar.shein.com/Men-s-Casual-Printed-Set-White-Short-Sleeve-Top-Paired-With-Black-Shorts-Running-Animal-Pattern-Design-Fashionable-And-Comfortable-Radiating-Summer-Street-Style-p-388716716.html' }, headers: { 'x-forwarded-for': '127.0.0.1' } } as any;
const res = { 
  status: (code: any) => ({ json: (data: any) => console.log('STATUS:', code, data) }),
  setHeader: () => {}
} as any;

handler(req, res).catch(console.error);
