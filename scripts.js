document.addEventListener('DOMContentLoaded', () => {
  const userId = getUserIdFromUrl();
  if (!userId) {
    alert('User ID is missing in the URL');
    return;
  }
  updateStatus(userId);
  fetchHistory(userId);
  populateActivityButtons(userId);
  populateDropdowns(userId);
  openTab(null, 'history');
});

function getUserIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('userId');
}

function updateStatus(userId) {
  fetch(`https://your-app-url.com/status?userId=${userId}`)
    .then(response => response.json())
    .then(data => {
      document.getElementById('currentPunches').innerText = `Current Punches: ${data.currentPunches}`;
      document.getElementById('unredeemedPunchcards').innerText = `Unredeemed Punchcards: ${data.unredeemedPunchcards}`;
      document.getElementById('redeemedPunchcards').innerText = `Redeemed Punchcards: ${data.redeemedPunchcards}`;
      const redeemButton = document.querySelector('button[onclick="redeemReward()"]');
      if (data.unredeemedPunchcards > 0) {
        redeemButton.disabled = false;
        redeemButton.style.backgroundColor = '#00796b';
        redeemButton.style.cursor = 'pointer';
      } else {
        redeemButton.disabled = true;
        redeemButton.style.backgroundColor = '#cccccc';
        redeemButton.style.cursor = 'not-allowed';
      }
    })
    .catch(error => console.error('Error fetching status:', error));
}

function addPunch() {
  const userId = getUserIdFromUrl();
  let activity = document.getElementById('activityDropdown').value;
  if (activity === 'other') {
    activity = document.getElementById('activity').value;
  }
  fetch(`https://your-app-url.com/punch?userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ activity })
  })
  .then(() => {
    updateStatus(userId);
    fetchHistory(userId);
  })
  .catch(error => console.error('Error adding punch:', error));
}

function redeemReward() {
  const userId = getUserIdFromUrl();
  let reward = document.getElementById('rewardDropdown').value;
  if (reward === 'other') {
    reward = document.getElementById('reward').value;
  }
  fetch(`https://your-app-url.com/reward?userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reward })
  })
  .then(() => {
    updateStatus(userId);
    fetchHistory(userId);
  })
  .catch(error => console.error('Error redeeming reward:', error));
}

function fetchHistory(userId) {
  fetch(`https://your-app-url.com/history?userId=${userId}`)
    .then(response => response.json())
    .then(history => {
      const historyList = document.getElementById('historyList');
      historyList.innerHTML = '';
      history.reverse();
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
        editLink.onclick = () => editLog(entry.id, entry.activity, userId);

        const deleteLink = document.createElement('span');
        deleteLink.innerHTML = 'Delete';
        deleteLink.className = 'delete-link';
        deleteLink.onclick = () => {
          if (confirm('Are you sure you want to delete this log?')) {
            deleteLog(entry.id, userId);
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

function editLog(logId, currentActivity, userId) {
  const newActivity = prompt('Enter new activity:', currentActivity);
  if (newActivity && newActivity !== currentActivity) {
    fetch(`https://your-app-url.com/edit?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logId, newActivity })
    })
    .then(() => {
      updateStatus(userId);
      fetchHistory(userId);
    })
    .catch(error => console.error('Error editing log:', error));
  }
}

function deleteLog(logId, userId) {
  fetch(`https://your-app-url.com/delete?userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ logId })
  })
  .then(() => {
    updateStatus(userId);
    fetchHistory(userId);
  })
  .catch(error => console.error('Error deleting log:', error));
}

function populateActivityButtons(userId) {
  const activityButtonsContainer = document.getElementById('activityButtons');
  activityButtonsContainer.innerHTML = '';
  popularActivities.forEach(activity => {
    const button = document.createElement('button');
    button.innerHTML = `<span>${activityIcons[activity]}</span> ${activity.charAt(0).toUpperCase() + activity.slice(1)}`;
    button.onclick = () => fillActivity(activity, userId);
    activityButtonsContainer.appendChild(button);
  });
}

function populateDropdowns(userId) {
  const activityDropdown = document.getElementById('activityDropdown');
  const rewardDropdown = document.getElementById('rewardDropdown');

  allActivities.forEach(activity => {
    if (!popularActivities.includes(activity)) {
      const option = document.createElement('option');
      option.value = activity;
      option.text = `${activityIcons[activity]} ${activity.charAt(0).toUpperCase() + activity.slice(1)}`;
      activityDropdown.appendChild(option);
    }
  });
  const otherActivityOption = document.createElement('option');
  otherActivityOption.value = 'other';
  otherActivityOption.text = `${activityIcons["other"]} Other`;
  activityDropdown.appendChild(otherActivityOption);

  allRewards.forEach(reward => {
    const option = document.createElement('option');
    option.value = reward;
    option.text = `${rewardIcons[reward]} ${reward.charAt(0).toUpperCase() + reward.slice(1)}`;
    rewardDropdown.appendChild(option);
  });
  const otherRewardOption = document.createElement('option');
  otherRewardOption.value = 'other';
  otherRewardOption.text = `${rewardIcons["other"]} Other`;
  rewardDropdown.appendChild(otherRewardOption);

  activityDropdown.onchange = () => {
    document.getElementById('activity').style.display = activityDropdown.value === 'other' ? 'block' : 'none';
  }

  rewardDropdown.onchange = () => {
    document.getElementById('reward').style.display = rewardDropdown.value === 'other' ? 'block' : 'none';
  }
}

function fillActivity(activity, userId) {
  fetch(`https://your-app-url.com/punch?userId=${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ activity })
  })
  .then(() => {
    updateStatus(userId);
    fetchHistory(userId);
  })
  .catch(error => console.error('Error adding punch:', error));
}

function openTab(evt, tabName) {
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.style.display = 'none');

  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => button.classList.remove('active'));

  document.getElementById(tabName).style.display = 'block';
  if (evt) {
    evt.currentTarget.classList.add('active');
  } else {
    document.querySelector(`.tab-button[onclick="openTab(event, '${tabName}')"]`).classList.add('active');
  }
}
