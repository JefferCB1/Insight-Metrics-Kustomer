const https = require('https');

const options = {
  hostname: 'api.kustomer.com',
  path: '/v1/users/current',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4N2Q4ODM0MjVkN2E4MTAwZThhYzc1OSIsInVzZXIiOiI2ODdkODgzM2M1OTRjYjAxYTgzZWEwZmIiLCJvcmciOiI2NDFjNzU2MWZmOTFjYzJmZDA2MGMwYmYiLCJvcmdOYW1lIjoiYmlhLWVuZXJneSIsInVzZXJUeXBlIjoibWFjaGluZSIsInBvZCI6InByb2QxIiwicm9sZXMiOlsib3JnLmFkbWluIiwib3JnLnVzZXIiLCJvcmcuYWRtaW4uYW5hbHl0aWNzIl0sImF1ZCI6InVybjpjb25zdW1lciIsImlzcyI6InVybjphcGkiLCJzdWIiOiI2ODdkODgzM2M1OTRjYjAxYTgzZWEwZmIifQ.DwUChu4LOAniA5NkIbayEl9qODbjipGEBtBUThMdF9Y',
    'Content-Type': 'application/json'
  }
};

console.log('🔍 Probando conexión con Kustomer desde WSL...');

https.get(options, (res) => {
  console.log('✅ Status:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('✅ Respuesta:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('📄 Respuesta:', data);
    }
  });
}).on('error', (e) => {
  console.error('❌ Error:', e.message);
});
