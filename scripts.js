// Generate a unique identifier
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Set a cookie
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

// Get a cookie
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// **Check if user ID exists, if not, generate one**
let userId = getCookie('userId');
if (!userId) {
  userId = generateUUID();
  setCookie('userId', userId, 365); // Set cookie for 1 year
}

document.addEventListener('DOMContentLoaded', () => {
  updateStatus();
  fetchHistory();
  populateActivityButtons();
  populateDropdowns();
  openTab(null, 'history'); // Default to the History tab
});

function updateStatus() {
  fetch('https://my-gym-punchcard.kathyyliao.workers.dev/status', {
    method: 'GET',
    credentials: 'include' // **Include credentials**
  })
    .then(response => response.json())
    .then(data => {
      document.getElementById('currentPunches').innerText = `Current Punches: ${data.currentPunches}`;
      document.getElementById('unredeemedPunchcards').innerText = `Unredeemed Punchcards: ${data.unredeemedPunchcards}`;
      document.getElementById('redeemedPunchcards').innerText = `Redeemed Punchcards: ${data.redeemedPunchcards}`;
    })
    .catch(error => console.error('Error fetching status:', error));
}

window.addPunch = function addPunch() {
  let activity = document.getElementById('activityDropdown').value;
  if (activity === 'other') {
    activity = document.getElementById('activity').value;
  }
  fetch('https://my-gym-punchcard.kathyyliao.workers.dev/punch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ activity }),
    credentials: 'include' // **Include credentials**
  })
    .then(() => {
      updateStatus();
      fetchHistory(); // Ensure fetchHistory is called to update the chart
    })
    .catch(error => console.error('Error adding punch:', error));
}

window.redeemReward = function redeemReward() {
  let reward = document.getElementById('rewardDropdown').value;
  if (reward === 'other') {
    reward = document.getElementById('reward').value;
  }
  fetch('https://my-gym-punchcard.kathyyliao.workers.dev/reward', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reward }),
    credentials: 'include' // **Include credentials**
  })
    .then(() => {
      updateStatus();
      fetchHistory(); // Ensure fetchHistory is called to update the chart
    })
    .catch(error => console.error('Error redeeming reward:', error));
}

window.fillActivity = function fillActivity(activity) {
  fetch('https://my-gym-punchcard.kathyyliao.workers.dev/punch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ activity }),
    credentials: 'include' // **Include credentials**
  })
    .then(() => {
      updateStatus();
      fetchHistory(); // Ensure fetchHistory is called to update the chart
    })
    .catch(error => console.error('Error adding punch:', error));
}

function fetchHistory() {
  fetch('https://my-gym-punchcard.kathyyliao.workers.dev/history', {
    method: 'GET',
    credentials: 'include' // **Include credentials**
  })
    .then(response => response.json())
    .then(history => {
      const historyList = document.getElementById('historyList');
      historyList.innerHTML = '';
      history.reverse(); // Reverse the history array to show newest first
      history.forEach(entry => {
        const listItem = document.createElement('li');
        const date = new Date(entry.date).toLocaleDateString();

        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const historyDetails = document.createElement('div');
        historyDetails.className = 'history-details';

        const icon = document.createElement('span');
        icon.className = 'icon';
        if (entry.type === 'punch') {
          icon.textContent = activityIcons[entry.activity] || activityIcons["default"];
          historyItem.classList.add('punch');
        } else {
          icon.textContent = rewardIcons[entry.reward] || rewardIcons["default"];
          historyItem.classList.add('reward');
        }

        historyDetails.appendChild(document.createTextNode(date));
        historyDetails.appendChild(icon);
        historyDetails.appendChild(document.createTextNode(entry.type === 'punch' ? ` ${entry.activity}` : ` ${entry.reward}`));

        const editLink = document.createElement('span');
        editLink.innerHTML = 'Edit';
        editLink.className = 'edit-link';
        editLink.onclick = () => editLog(entry.id, entry.activity);

        const deleteLink = document.createElement('span');
        deleteLink.innerHTML = 'Delete';
        deleteLink.className = 'delete-link';
        deleteLink.onclick = () => {
          if (confirm('Are you sure you want to delete this log?')) {
            deleteLog(entry.id);
          }
        };

        const historyButtons = document.createElement('div');
        historyButtons.className = 'history-buttons';
        historyButtons.appendChild(editLink);
        historyButtons.appendChild(deleteLink);

        historyItem.appendChild(historyDetails);
        listItem.appendChild(historyItem);
        listItem.appendChild(historyButtons);

        historyList.appendChild(listItem);
      });

      // Update chart data
      updateChart(history);
    })
    .catch(error => console.error('Error fetching history:', error));
}

// Other existing functions remain the same...
