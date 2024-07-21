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
  
	try {
	  if (path[0] === 'punch') {
		response = await handlePunch(request);
	  } else if (path[0] === 'status') {
		response = await handleStatus(request);
	  } else if (path[0] === 'reward') {
		response = await handleReward(request);
	  } else if (path[0] === 'history') {
		response = await handleHistory(request);
	  } else if (path[0] === 'delete') {
		response = await handleDelete(request); // Add this line
	  } else {
		response = new Response('Not found', { status: 404 });
	  }
	} catch (error) {
	  console.error('Error handling request:', error);
	  response = new Response('Internal Server Error', { status: 500 });
	}
  
	// Ensure headers are added to every response
	response.headers.set('Access-Control-Allow-Origin', 'https://gym-punchcard.pages.dev');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
	return response;
  }
  
  function handleOptions(request) {
	// Create a response for OPTIONS request with the necessary CORS headers
	const headers = {
	  'Access-Control-Allow-Origin': 'https://gym-punchcard.pages.dev',
	  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	  'Access-Control-Allow-Headers': 'Content-Type'
	};
	return new Response(null, { headers });
  }
  
  // Add this function to handle delete requests
  async function handleDelete(request) {
	const { logId } = await request.json();
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
	userData.history = userData.history.filter(entry => entry.id !== logId);
  
	await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	return new Response('Log entry deleted');
  }
  
  // Existing functions...
  async function handlePunch(request) {
	const { activity } = await request.json();
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
	if (userData.currentPunches >= 5) {
	  userData.unredeemedPunchcards += 1;
	  userData.currentPunches = 0;
	}
  
	userData.currentPunches += 1;
  
	if (userData.currentPunches >= 5) {
	  userData.unredeemedPunchcards += 1;
	  userData.currentPunches = 0;
	}
  
	// Log activity in history
	if (!userData.history) {
	  userData.history = [];
	}
	userData.history.push({ id: Date.now().toString(), type: 'punch', activity, date: new Date().toISOString() });
  
	await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	return new Response(`Punch added! Current punches: ${userData.currentPunches}`);
  }
  
  async function handleReward(request) {
	const { reward } = await request.json();
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
	if (userData.unredeemedPunchcards < 1) {
	  return new Response('No unredeemed punchcards available.', { status: 400 });
	}
  
	userData.unredeemedPunchcards -= 1;
	userData.redeemedPunchcards += 1;
  
	// Log reward in history
	if (!userData.history) {
	  userData.history = [];
	}
	userData.history.push({ id: Date.now().toString(), type: 'reward', reward, date: new Date().toISOString() });
  
	await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	return new Response('Reward claimed! Punchcard reset.');
  }
  
  async function handleHistory(request) {
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
	return new Response(JSON.stringify(userData.history || []), {
	  headers: { 'Content-Type': 'application/json' }
	});
  }
  
  async function handleStatus(request) {
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
	return new Response(JSON.stringify(userData), {
	  headers: { 'Content-Type': 'application/json' }
	});
  }
  
  async function getUserId(request) {
	// Implement a way to identify users, e.g., via cookies, headers, etc.
	// For simplicity, let's use a fixed user ID.
	return 'user-123';
  }
  
  async function getUserData(id) {
	const userData = await PUNCHCARDS.get(id);
	return userData ? JSON.parse(userData) : { currentPunches: 0, unredeemedPunchcards: 0, redeemedPunchcards: 0, history: [] };
  }
  