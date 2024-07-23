addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
	const url = new URL(request.url);
	const path = url.pathname.split('/').filter(Boolean);
  
	if (request.method === 'OPTIONS') {
	  return handleOptions(request);
	}
  
	let response;
	if (path[0] === 'register' && request.method === 'POST') {
	  response = await handleRegister(request);
	} else if (path[0] === 'reset' && request.method === 'POST') {
	  response = await handleReset(request);
	} else {
	  const userId = url.searchParams.get('userId');
	  if (!userId) {
		return new Response('User ID not provided', { status: 400 });
	  }
  
	  if (path[0] === 'punch') {
		response = await handlePunch(request, userId);
	  } else if (path[0] === 'status') {
		response = await handleStatus(request, userId);
	  } else if (path[0] === 'history') {
		response = await handleHistory(request, userId);
	  } else if (path[0] === 'delete') {
		response = await handleDelete(request, userId);
	  } else {
		response = new Response('Not found', { status: 404 });
	  }
	}
  
	// Ensure headers are added to every response
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
	return response;
  }
  
  function handleOptions(request) {
	const headers = {
	  'Access-Control-Allow-Origin': '*',
	  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	  'Access-Control-Allow-Headers': 'Content-Type',
	};
	return new Response(null, { headers });
  }
  
  async function handleRegister(request) {
	const { name } = await request.json();
	const userId = generateUniqueId(name);
	const userUrl = `https://gym-punchcard.pages.dev/?userId=${userId}`;
	return new Response(userUrl, { headers: { 'Content-Type': 'text/plain' } });
  }
  
  function generateUniqueId(name) {
	return name.toLowerCase() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  async function handleReset(request) {
	const { userId } = await request.json();
	const initialData = { currentPunches: 0, unredeemedPunchcards: 0, redeemedPunchcards: 0, history: [] };
	await PUNCHCARDS.put(`user:${userId}:data`, JSON.stringify(initialData));
	
	return new Response('User data reset', { headers: { 'Content-Type': 'text/plain' } });
  }
  
  async function handlePunch(request, userId) {
	const { activity } = await request.json();
	const userData = await getUserData(userId);
  
	userData.currentPunches += 1;
	if (userData.currentPunches >= 5) {
	  userData.unredeemedPunchcards += 1;
	  userData.currentPunches = 0;
	}
  
	userData.history.push({ id: Date.now().toString(), type: 'punch', activity, date: new Date().toISOString() });
  
	await PUNCHCARDS.put(`user:${userId}:data`, JSON.stringify(userData));
	return new Response(`Punch added! Current punches: ${userData.currentPunches}`, { headers: { 'Content-Type': 'text/plain' } });
  }
  
  async function handleStatus(request, userId) {
	const userData = await getUserData(userId);
	return new Response(JSON.stringify(userData), {
	  headers: { 'Content-Type': 'application/json' }
	});
  }
  
  async function handleHistory(request, userId) {
	const userData = await getUserData(userId);
	return new Response(JSON.stringify(userData.history || []), {
	  headers: { 'Content-Type': 'application/json' }
	});
  }
  
  async function handleDelete(request, userId) {
	const { logId } = await request.json();
	const userData = await getUserData(userId);
  
	const entryIndex = userData.history.findIndex(entry => entry.id === logId);
	if (entryIndex === -1) {
	  return new Response('Log entry not found', { status: 404 });
	}
  
	const entry = userData.history[entryIndex];
  
	if (entry.type === 'punch') {
	  userData.currentPunches -= 1;
	  if (userData.currentPunches < 0 && userData.unredeemedPunchcards > 0) {
		userData.unredeemedPunchcards -= 1;
		userData.currentPunches += 5;
	  }
	} else if (entry.type === 'reward') {
	  userData.redeemedPunchcards -= 1;
	}
  
	userData.history.splice(entryIndex, 1);
  
	await PUNCHCARDS.put(`user:${userId}:data`, JSON.stringify(userData));
	return new Response('Log entry deleted', { headers: { 'Content-Type': 'text/plain' } });
  }
  
  async function getUserData(userId) {
	let userData = await PUNCHCARDS.get(`user:${userId}:data`);
  
	if (!userData) {
	  userData = await PUNCHCARDS.get(`data`);
	  if (userData) {
		await PUNCHCARDS.put(`user:${userId}:data`, userData);
		await PUNCHCARDS.delete(`data`);
	  } else {
		userData = JSON.stringify({ currentPunches: 0, unredeemedPunchcards: 0, redeemedPunchcards: 0, history: [] });
	  }
	}
  
	return JSON.parse(userData);
  }
  