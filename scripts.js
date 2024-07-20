document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
  
    document.getElementById('add-punch-btn').addEventListener('click', () => {
      const activityDropdown = document.getElementById('activity-dropdown');
      const activity = activityDropdown.value === 'other' ? document.getElementById('activity-input').value : activityDropdown.value;
      addPunch(activity);
    });
  
    document.getElementById('redeem-reward-btn').addEventListener('click', () => {
      const rewardDropdown = document.getElementById('reward-dropdown');
      const reward = rewardDropdown.value === 'other' ? document.getElementById('reward-input').value : rewardDropdown.value;
      redeemReward(reward);
    });
  
    document.getElementById('activity-dropdown').addEventListener('change', (event) => {
      const input = document.getElementById('activity-input');
      input.style.display = event.target.value === 'other' ? 'block' : 'none';
    });
  
    document.getElementById('reward-dropdown').addEventListener('change', (event) => {
      const input = document.getElementById('reward-input');
      input.style.display = event.target.value === 'other' ? 'block' : 'none';
    });
  
    document.getElementById('history-tab').addEventListener('click', () => {
      showTab('history');
    });
  
    document.getElementById('analytics-tab').addEventListener('click', () => {
      showTab('analytics');
      renderActivityChart();  // Call the function to render the chart when the tab is clicked
    });
  });
  
  function addPunch(activity) {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/api/punch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ activity }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to add punch');
      }
      updateStatus();
      updateHistory();
    })
    .catch(error => {
      console.error(error);
    });
  }
  
  function redeemReward(reward) {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/api/reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reward }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to redeem reward');
      }
      updateStatus();
      updateHistory();
    })
    .catch(error => {
      console.error(error);
    });
  }
  
  function updateStatus() {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/api/status')
      .then(response => response.json())
      .then(data => {
        document.getElementById('currentPunches').textContent = data.currentPunches;
        document.getElementById('unredeemedPunchcards').textContent = data.unredeemedPunchcards;
        document.getElementById('redeemedPunchcards').textContent = data.redeemedPunchcards;
      })
      .catch(error => {
        console.error('Error fetching status:', error);
      });
  }
  
  function updateHistory() {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/api/history')
      .then(response => response.json())
      .then(history => {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        history.reverse().forEach(entry => {  // Reverse the order of the history entries
          const listItem = document.createElement('li');
          listItem.innerHTML = `
            ${entry.date} ${entry.type === 'punch' ? '🏋️' : '🥧'} ${entry.activity || entry.reward}
            <button onclick="editLog('${entry.id}')">Edit</button>
            <button onclick="deleteLog('${entry.id}')">Delete</button>
          `;
          historyList.appendChild(listItem);
        });
      })
      .catch(error => {
        console.error('Error fetching history:', error);
      });
  }
  
  function showTab(tabName) {
    document.getElementById('history').style.display = tabName === 'history' ? 'block' : 'none';
    document.getElementById('analytics').style.display = tabName === 'analytics' ? 'block' : 'none';
    document.getElementById('history-tab').classList.toggle('active', tabName === 'history');
    document.getElementById('analytics-tab').classList.toggle('active', tabName === 'analytics');
  }
  
  function addGym() {
    addPunch('gym');
  }
  
  function addPickleball() {
    addPunch('pickleball');
  }
  
  function addYoga() {
    addPunch('yoga');
  }
  
  function editLog(logId) {
    const newActivity = prompt('Enter the new activity:');
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/api/edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logId, newActivity }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to edit log');
      }
      updateHistory();
      updateStatus();
    })
    .catch(error => {
      console.error('Error editing log:', error);
    });
  }
  
  function deleteLog(logId) {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/api/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logId }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to delete log');
      }
      updateHistory();
      updateStatus();
    })
    .catch(error => {
      console.error('Error deleting log:', error);
    });
  }
  
  function renderActivityChart() {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/api/history')
      .then(response => response.json())
      .then(history => {
        const activityCounts = history.reduce((counts, entry) => {
          if (entry.type === 'punch') {
            counts[entry.activity] = (counts[entry.activity] || 0) + 1;
          }
          return counts;
        }, {});
  
        const sortedActivities = Object.entries(activityCounts).sort((a, b) => b[1] - a[1]);
  
        const labels = sortedActivities.map(item => item[0]);
        const data = sortedActivities.map(item => item[1]);
  
        const ctx = document.getElementById('activityChart').getContext('2d');
        new Chart(ctx, {
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
                beginAtZero: true
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('Error fetching history for analytics:', error);
      });
  }
  