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
    "other": "❓",
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
    "other": "❓",
    "default": "🎉" // Default icon for rewards not explicitly listed
  };
  
  // Most popular activities
  const popularActivities = ["gym", "pickleball", "yoga"];
  // All activities including the popular ones
  const allActivities = ["walk", "run", "gym", "hike", "pickleball", "yoga", "pilates", "dance", "snowboarding", "stairs"];
  
  const allRewards = ["pie", "cake", "ice cream", "brownies", "cookies", "boba", "candy", "smoothies"];
  
  let activityChart; // Global variable to store the chart instance
  
  document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
    fetchHistory();
    populateActivityButtons();
    populateDropdowns();
    openTab(null, 'history'); // Default to the History tab
  });
  
  function updateStatus() {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/status')
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
      body: JSON.stringify({ activity })
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
      body: JSON.stringify({ reward })
    })
    .then(() => {
      updateStatus();
      fetchHistory(); // Ensure fetchHistory is called to update the chart
    })
    .catch(error => console.error('Error redeeming reward:', error));
  }
  
  // Function to log the activity directly
  window.fillActivity = function fillActivity(activity) {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/punch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activity })
    })
    .then(() => {
      updateStatus();
      fetchHistory(); // Ensure fetchHistory is called to update the chart
    })
    .catch(error => console.error('Error adding punch:', error));
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
          historyDetails.appendChild(document.createTextNode(entry.type === 'punch' ? ` ${entry.activity}` : ` ${entry.reward}`));
  
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
  
        // Update chart data
        updateChart(history);
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
        fetchHistory(); // Ensure fetchHistory is called to update the chart
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
      fetchHistory(); // Ensure fetchHistory is called to update the chart
    })
    .catch(error => console.error('Error deleting log:', error));
  }
  
  function populateActivityButtons() {
    const activityButtonsContainer = document.getElementById('activityButtons');
    activityButtonsContainer.innerHTML = '';
    popularActivities.forEach(activity => {
      const button = document.createElement('button');
      button.innerHTML = `<span>${activityIcons[activity]}</span> ${activity.charAt(0).toUpperCase() + activity.slice(1)}`;
      button.onclick = () => fillActivity(activity);
      activityButtonsContainer.appendChild(button);
    });
  }
  
  function populateDropdowns() {
    const activityDropdown = document.getElementById('activityDropdown');
    const rewardDropdown = document.getElementById('rewardDropdown');
  
    // Populate activity dropdown
    allActivities.forEach(activity => {
      if (!popularActivities.includes(activity)) { // Exclude popular activities already having buttons
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
  
    // Populate reward dropdown
    allRewards.forEach(reward => {
      const option = document.createElement('option');
      option.value = reward;
      option.text = `${rewardIcons[reward]} ${reward.charAt(0).toUpperCase() + reward.slice(1)    }`;
      rewardDropdown.appendChild(option);
    });
    const otherRewardOption = document.createElement('option');
    otherRewardOption.value = 'other';
    otherRewardOption.text = `${rewardIcons["other"]} Other`;
    rewardDropdown.appendChild(otherRewardOption);
  
    // Show or hide the input fields based on the selected option
    activityDropdown.onchange = () => {
      document.getElementById('activity').style.display = activityDropdown.value === 'other' ? 'block' : 'none';
    }
  
    rewardDropdown.onchange = () => {
      document.getElementById('reward').style.display = rewardDropdown.value === 'other' ? 'block' : 'none';
    }
  }
  
  function updateChart(history) {
    const activityCounts = {};
    history.forEach(entry => {
      if (entry.type === 'punch') {
        activityCounts[entry.activity] = (activityCounts[entry.activity] || 0) + 1;
      }
    });
  
    const sortedActivities = Object.keys(activityCounts).sort((a, b) => activityCounts[b] - activityCounts[a]);
    const labels = sortedActivities.map(activity => `${activity} (${activityCounts[activity]})`);
    const data = sortedActivities.map(activity => activityCounts[activity]);
  
    const ctx = document.getElementById('activityChart').getContext('2d');
  
    if (activityChart) {
      activityChart.data.labels = labels;
      activityChart.data.datasets[0].data = data;
      activityChart.update();
    } else {
      activityChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Activity Count',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1 // Ensure only whole numbers are displayed
              }
            }
          }
        }
      });
    }
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