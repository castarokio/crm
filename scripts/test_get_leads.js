const { getLeads } = require('./src/app/actions.ts');

async function test() {
  console.log('Running getLeads with status: Not Interested');
  const res = await getLeads({
    search: '',
    status: 'Not Interested',
    priority: '',
    area: '',
    page: 1,
    limit: 12,
    excludeLost: false
  });
  console.log('Result:', res);
}

test();
