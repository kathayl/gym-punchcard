// scripts.js

// Define icon mappings for activities and rewards
const activityIcons = {
    "walk": "🚶‍♀️",
    "run": "🏃‍♀️",
    "gym": "🏋️‍♀️",
    "hike": "🥾",
    "pickleball": "🏓",
    "yoga": "🧘‍♀️",
    "pilates": "🤸‍♀️",
    "dance": "💃",
    "snowboarding": "🏂",
    "stairs": "🪜",
    // Add more activities as needed
    "default": "🏃‍♂️" // Default icon for activities not explicitly listed
  };
  
  const rewardIcons = {
    "pie": "🥧",
    "cake": "🎂",
    "ice cream": "🍦",
    "brownies": "🍫",
    "cookies": "🍪",
    "boba": "🧋",
    "candy": "🍬",
    "smoothies": "🥤",
    // Add more rewards as needed
    "default": "🎉" // Default icon for rewards not explicitly listed
  };
  
  
document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
    fetchHistory();
  });
  
  function updateStatus() {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/status')
      .then(response => response.json())
      .then(data => {
        document.getElementById('currentPunches').innerText = `Current Punches: ${data.currentPunches}`;
        document.getElementById('unredeemedPunchcards').innerText = `Unredeemed Punchcards: ${data.unredeemedPunchcards}`;
        document.getElementById('redeemedPunchcards').innerText = `Redeemed Punchcards: ${data.redeemedPunchcards}`;
      })
      .catch(error => console.error('Error fetching status:', error));
  }
  
  window.addPunch = function addPunch() {
    const activity = document.getElementById('activity').value;
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/punch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activity })
    })
      .then(() => {
        updateStatus();
        fetchHistory();
      })
      .catch(error => console.error('Error adding punch:', error));
  }
  
  window.redeemReward = function redeemReward() {
    const reward = document.getElementById('reward').value;
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reward })
    })
      .then(() => {
        updateStatus();
        fetchHistory();
      })
      .catch(error => console.error('Error redeeming reward:', error));
  }
  
  function fetchHistory() {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/history')
      .then(response => response.json())
      .then(history => {
        console.log('Fetched history:', history); // Debugging log
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
          historyDetails.appendChild(document.createTextNode(entry.type === 'punch' ? `${entry.activity}` : `${entry.reward}`));
  
          // Add edit link
          const editLink = document.createElement('span');
          editLink.innerHTML = 'Edit';
          editLink.className = 'edit-link';
          editLink.onclick = () => editLog(entry.id, entry.activity);
  
          // Add delete link
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
      })
      .catch(error => console.error('Error fetching history:', error));
  }
  
  function editLog(logId, currentActivity) {
    const newActivity = prompt('Enter new activity:', currentActivity);
    if (newActivity && newActivity !== currentActivity) {
      fetch('https://my-gym-punchcard.kathyyliao.workers.dev/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logId, newActivity })
      })
        .then(() => {
          updateStatus();
          fetchHistory();
        })
        .catch(error => console.error('Error editing log:', error));
    }
  }
  
  function deleteLog(logId) {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logId })
    })
      .then(() => {
        updateStatus();
        fetchHistory();
      })
      .catch(error => console.error('Error deleting log:', error));
  }
  