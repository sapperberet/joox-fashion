const url = 'https://znyulxwneqkvombolyii.supabase.co/rest/v1/coupons';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpueXVseHduZXFrdm9tYm9seWlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODA2OTIyNiwiZXhwIjoyMDkzNjQ1MjI2fQ.pf1QpVggdweZk3YNrJNP-wiAZBP-P1RqAxjHxLmrS7I';

(async () => {
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        code: 'TEST10',
        type: 'percent',
        value: 10,
        min_subtotal: 0,
        max_uses: 100,
        used_count: 0,
        is_active: true,
      }),
    });
    const text = await resp.text();
    console.log('Status:', resp.status);
    console.log(text);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
