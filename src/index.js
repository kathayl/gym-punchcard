addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
  });
  
  async function handleRequest(request) {
	const url = new URL(request.url);
	const path = url.pathname.split('/').filter(Boolean);
  
	let response;
  
	if (path[0] === 'punch') {
	  response = await handlePunch(request);
	} else if (path[0] === 'status') {
	  response = await handleStatus(request);
	} else if (path[0] === 'reward') {
	  response = await handleReward(request);
	} else if (path[0] === 'history') {
	  response = await handleHistory(request);
	} else {
	  response = new Response('Not found', { status: 404 });
	}
  
	response = new Response(response.body, response); // Clone the response to add headers
	response.headers.set('Access-Control-Allow-Origin', 'https://gym-punchcard.pages.dev');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
	response.headers.set('Access-Control-Allow-Credentials', 'true'); // Add this line
  
	return response;
  }
  
  async function handlePunch(request) {
	const { activity } = await request.json();
	const userId = await getUserId(request);
	const userData = await getUserData(userId);
  
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
	userData.history.push({ type: 'punch', activity, date: new Date().toISOString() });
  
	await PUNCHCARDS.put(`user_${userId}_data`, JSON.stringify(userData));
  
	return new Response(`Punch added! Current punches: ${userData.currentPunches}`);
  }
  
  async function handleReward(request) {
	const { reward } = await request.json();
	const userId = await getUserId(request);
	const userData = await getUserData(userId);
  
	if (userData.unredeemedPunchcards < 1) {
	  return new Response('No unredeemed punchcards available.', { status: 400 });
	}
  
	userData.unredeemedPunchcards -= 1;
	userData.redeemedPunchcards += 1;
  
	// Log reward in history
	if (!userData.history) {
	  userData.history = [];
	}
	userData.history.push({ type: 'reward', reward, date: new Date().toISOString() });
  
	await PUNCHCARDS.put(`user_${userId}_data`, JSON.stringify(userData));
  
	return new Response('Reward claimed! Punchcard reset.');
  }
  
  async function handleHistory(request) {
	const userId = await getUserId(request);
	const userData = await getUserData(userId);
  
	return new Response(JSON.stringify(userData.history || []), {
	  headers: { 'Content-Type': 'application/json' }
	});
  }
  
  async function handleStatus(request) {
	const userId = await getUserId(request);
	const userData = await getUserData(userId);
  
	return new Response(JSON.stringify(userData), {
	  headers: { 'Content-Type': 'application/json' }
	});
  }
  
  async function getUserId(request) {
	// Extract userId from cookies in the request headers
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
  
  async function getUserData(userId) {
	const userData = await PUNCHCARDS.get(`user_${userId}_data`);
	return userData ? JSON.parse(userData) : { currentPunches: 0, unredeemedPunchcards: 0, redeemedPunchcards: 0, history: [] };
  }
  