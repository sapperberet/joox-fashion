const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXVseHduZXFrdm9tYm9seWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwNjkyMjYsImV4cCI6MjA5MzY0NTIyNn0.UawYglGtxqlosz9BwmVvok2NQ9_SI9edstxCuEs-Hyc';
const BASE_URL = 'https://znyulxwneqkvombolyii.supabase.co';

// Query information schema to see actual columns
fetch(`${BASE_URL}/rest/v1/rpc/get_columns`, {
  method: 'POST',
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ table_name: 'products' }),
})
.then(r => r.json())
.then(data => {
  console.log('Products table columns:', JSON.stringify(data, null, 2));
})
.catch(err => console.error('Error:', err.message));
