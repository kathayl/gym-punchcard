addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
	const url = new URL(request.url);
	const path = url.pathname.split('/').filter(Boolean);
  
	if (path[0] === 'register' && request.method === 'POST') {
	  return handleRegister(request);
	} else if (path[0] === 'reset' && request.method === 'POST') {
	  return handleReset(request);
	}
  
	// Add the user ID check for other routes
	const userId = url.searchParams.get('userId');
	if (!userId) {
	  return new Response('User ID not provided', { status: 400 });
	}
  
	if (path[0] === 'punch') {
	  return handlePunch(request, userId);
	} else if (path[0] === 'status') {
	  return handleStatus(request, userId);
	} else if (path[0] === 'history') {
	  return handleHistory(request, userId);
	} else if (path[0] === 'delete') {
	  return handleDelete(request, userId);
	} else {
	  return new Response('Not found', { status: 404 });
	}
  }
  
  async function handleRegister(request) {
	const { name } = await request.json();
	const userId = generateUniqueId(name);
	const userUrl = `https://your-app-url.com/?userId=${userId}`;
	return new Response(userUrl);
  }
  
  function generateUniqueId(name) {
	return name.toLowerCase() + '-' + Math.random().toString(36).substr(2, 9);
  }
  
  async function handleReset(request) {
	const { userId } = await request.json();
	const initialData = { currentPunches: 0, unredeemedPunchcards: 0, redeemedPunchcards: 0, history: [] };
	await PUNCHCARDS.put(`user:${userId}:data`, JSON.stringify(initialData));
	
	return new Response('User data reset');
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
	return new Response(`Punch added! Current punches: ${userData.currentPunches}`);
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
	return new Response('Log entry deleted');
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
  