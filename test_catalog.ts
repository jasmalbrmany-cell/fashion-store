import handler from './api/catalog';
handler(
  { method: 'POST', body: { url: 'https://pletino.com', page: 1 }, headers: { 'x-real-ip': '127.0.0.1' } } as any,
  {
    setHeader: () => {},
    status: (code: number) => ({
      json: (d: any) => console.log('STATUS:', code, '\nBODY:', JSON.stringify(d, null, 2))
    })
  } as any
).catch(err => {
  console.error('FATAL ERROR:', err);
});
