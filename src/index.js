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
	  } else if (path[0] === 'edit') {
		response = await handleEdit(request);
	  } else {
		response = new Response('Not found', { status: 404 });
	  }
	} catch (error) {
	  console.error('Error handling request:', error);
	  response = new Response('Internal Server Error', { status: 500 });
	}
  
	response = new Response(response.body, response); // Clone the response to add headers
	response.headers.set('Access-Control-Allow-Origin', 'https://gym-punchcard.pages.dev');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
	return response;
  }
  
  function handleOptions(request) {
	const headers = {
	  'Access-Control-Allow-Origin': 'https://gym-punchcard.pages.dev',
	  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	  'Access-Control-Allow-Headers': 'Content-Type',
	};
	return new Response(null, { status: 204, headers });
  }
  
  async function handlePunch(request) {
	try {
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
	  if (!Array.isArray(userData.history)) {
		userData.history = [];
	  }
	  userData.history.push({ id: generateUniqueId(), type: 'punch', activity, date: new Date().toISOString() });
  
	  await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	  return new Response(`Punch added! Current punches: ${userData.currentPunches}`);
	} catch (error) {
	  console.error('Error in handlePunch:', error);
	  return new Response('Internal Server Error', { status: 500 });
	}
  }
  
  async function handleReward(request) {
	try {
	  const { reward } = await request.json();
	  const id = await getUserId(request);
	  const userData = await getUserData(id);
  
	  if (userData.unredeemedPunchcards < 1) {
		return new Response('No unredeemed punchcards available.', { status: 400 });
	  }
  
	  userData.unredeemedPunchcards -= 1;
	  userData.redeemedPunchcards += 1;
  
	  // Log reward in history
	  if (!Array.isArray(userData.history)) {
		userData.history = [];
	  }
	  userData.history.push({ id: generateUniqueId(), type: 'reward', reward, date: new Date().toISOString() });
  
	  await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	  return new Response('Reward claimed! Punchcard reset.');
	} catch (error) {
	  console.error('Error in handleReward:', error);
	  return new Response('Internal Server Error', { status: 500 });
	}
  }
  
  async function handleHistory(request) {
	try {
	  const id = await getUserId(request);
	  const userData = await getUserData(id);
  
	  return new Response(JSON.stringify(userData.history || []), {
		headers: { 'Content-Type': 'application/json' }
	  });
	} catch (error) {
	  console.error('Error in handleHistory:', error);
	  return new Response('Internal Server Error', { status: 500 });
	}
  }
  
  async function handleStatus(request) {
	try {
	  const id = await getUserId(request);
	  const userData = await getUserData(id);
  
	  return new Response(JSON.stringify(userData), {
		headers: { 'Content-Type': 'application/json' }
	  });
	} catch (error) {
	  console.error('Error in handleStatus:', error);
	  return new Response('Internal Server Error', { status: 500 });
	}
  }
  
  async function handleDelete(request) {
	try {
	  const { logId } = await request.json();
	  const id = await getUserId(request);
	  const userData = await getUserData(id);
  
	  const logIndex = userData.history.findIndex(entry => entry.id === logId);
	  if (logIndex === -1) {
		return new Response('Log entry not found.', { status: 404 });
	  }
  
	  const logEntry = userData.history[logIndex];
  
	  // Adjust counts
	  if (logEntry.type === 'punch') {
		userData.currentPunches -= 1;
		if (userData.currentPunches < 0 && userData.unredeemedPunchcards > 0) {
		  userData.unredeemedPunchcards -= 1;
		  userData.currentPunches = 4;
		}
	  } else if (logEntry.type === 'reward') {
		userData.redeemedPunchcards -= 1;
		userData.unredeemedPunchcards += 1;
	  }
  
	  // Remove the log entry
	  userData.history.splice(logIndex, 1);
  
	  await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	  return new Response('Log entry deleted and counts adjusted.');
	} catch (error) {
	  console.error('Error in handleDelete:', error);
	  return new Response('Internal Server Error', { status: 500 });
	}
  }
  
  async function handleEdit(request) {
	try {
	  const { logId, newActivity } = await request.json();
	  const id = await getUserId(request);
	  const userData = await getUserData(id);
  
	  const logIndex = userData.history.findIndex(entry => entry.id === logId);
	  if (logIndex === -1) {
		return new Response('Log entry not found.', { status: 404 });
	  }
  
	  // Update the log entry
	  userData.history[logIndex].activity = newActivity;
  
	  await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	  return new Response('Log entry updated.');
	} catch (error) {
	  console.error('Error in handleEdit:', error);
	  return new Response('Internal Server Error', { status: 500 });
	}
  }
  
  function generateUniqueId() {
	return Math.random().toString(36).substr(2, 9);
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
  