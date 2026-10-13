async function test() {
  try {
    const res = await fetch('https://trav-us.onrender.com/api/stops', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer demo-token-operator-01'
      },
      body: JSON.stringify({
        label: 'Test Destination Clinic',
        latitude: 37.78,
        longitude: -122.41,
        demand: 3,
        priority: 'normal',
        serviceDurationMinutes: 5,
        status: 'pending'
      })
    });
    const data = await res.json();
    console.log('STATUS:', res.status, data);
  } catch (e) {
    console.error('ERROR:', e);
  }
}
test();
