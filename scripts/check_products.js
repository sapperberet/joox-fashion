const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXVseHduZXFrdm9tYm9seWlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA2OTIyNiwiZXhwIjoyMDkzNjQ1MjI2fQ.pf1QpVggdweZk3YNrJNP-wiAZBP-P1RqAxjHxLmrS7I';
const BASE_URL = 'https://znyulxwneqkvombolyii.supabase.co';

fetch(`${BASE_URL}/rest/v1/products?select=id,name_en,is_active`, {
  headers: {
    apikey: API_KEY,
    Authorization: `Bearer ${API_KEY}`,
  },
})
.then(r => r.json())
.then(data => {
  console.log('Products in DB:', JSON.stringify(data, null, 2));
})
.catch(err => console.error('Error:', err.message));
