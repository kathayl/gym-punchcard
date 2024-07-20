/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

// listens for a fetch event. in this case, when receive HTTP request. 
addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
  });
  //figure out what action to take
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
	response.headers.set('Access-Control-Allow-Origin', '*');
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
	return response;
  }
  //function for adding punches and checking if card is full
  async function handlePunch(request) {
	const { activity } = await request.json();
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
	if (userData.currentPunches >= 5) {
	  userData.unredeemedPunchcards += 1;
	  userData.currentPunches = 0;
	}
  
	userData.currentPunches += 1;

   // Check again to see if punches reached 5 after incrementing
   if (userData.currentPunches >= 5) {
    userData.unredeemedPunchcards += 1;
    userData.currentPunches = 0;
  }

  // Log activity in history
  userData.history.push({ type: 'punch', activity, date: new Date().toISOString() });

	await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	return new Response(`Punch added! Current punches: ${userData.currentPunches}`);
  }

  //function for reward
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
  userData.history.push({ type: 'reward', reward, date: new Date().toISOString() });

	await PUNCHCARDS.put(id, JSON.stringify(userData));
  
	return new Response('Reward claimed! Punchcard reset.');
  }
  
  // History
  async function handleHistory(request) {
	const id = await getUserId(request);
	const userData = await getUserData(id);
  
	return new Response(JSON.stringify(userData.history), {
	  headers: { 'Content-Type': 'application/json' }
	});
  }

  //function for checking status aka how many punches
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
  //userData keeps track of current punches, redeemed and unredeemed punchcards
  async function getUserData(id) {
	const userData = await PUNCHCARDS.get(id);
	return userData ? JSON.parse(userData) : { currentPunches: 0, unredeemedPunchcards: 0, redeemedPunchcards: 0, history: [] };
  }