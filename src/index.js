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
		response = await handleDelete(request);
	  } else {
		response = new Response('Not found', { status: 404 });
	  }
	} catch (error) {
	  console.error('Error handling request:', error);
	  response = new Response('Internal Server Error', { status: 500 });
	}
  
	// **Ensure headers are added to every response**
	response.headers.set('Access-Control-Allow-Origin', 'https://gym-punchcard.pages.dev');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	response.headers.set('Access-Control-Allow-Credentials', 'true');
  
	return response;
  }
  
  function handleOptions(request) {
	const headers = {
	  'Access-Control-Allow-Origin': 'https://gym-punchcard.pages.dev',
	  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	  'Access-Control-Allow-Headers': 'Content-Type',
	  'Access-Control-Allow-Credentials': 'true',
	};
	return new Response(null, { headers });
  }
  
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
  
	if (!userData.history) {
	  userData.history = [];
	}
	userData.history.push({ id: Date.now().toString(), type: 'punch', activity, date: new Date().toISOString() });
  
	await PUNCHCARDS.put(`user_${id}_data`, JSON.stringify(userData));
  
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
  
	if (!userData.history) {
	  userData.history = [];
	}
	userData.history.push({ id: Date.now().toString(), type: 'reward', reward, date: new Date().toISOString() });
  
	await PUNCHCARDS.put(`user_${id}_data`, JSON.stringify(userData));
  
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
  
  async function handleDelete(request) {
	const { logId } = await request.json();
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
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
  
	await PUNCHCARDS.put(`user_${id}_data`, JSON.stringify(userData));
  
	return new Response('Log entry deleted');
  }
  
  // **Get the user ID from the request cookies**
  async function getUserId(request) {
	const cookieHeader = request.headers.get('Cookie');
	if (!cookieHeader) {
	  throw new Error('No cookies found');
	}
  
	const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
	  const [key, value] = cookie.split('=').map(c => c.trim());
	  acc[key] = value;
	  return acc;
	}, {});
  
	const userId = cookies['userId'];
	if (!userId) {
	  throw new Error('No userId cookie found');
	}
  
	return userId;
  }
  
  // **Get user data from KV store**
  async function getUserData(userId) {
	const userData = await PUNCHCARDS.get(`user_${userId}_data`);
	return userData ? JSON.parse(userData) : { currentPunches: 0, unredeemedPunchcards: 0, redeemedPunchcards: 0, history: [] };
  }
  