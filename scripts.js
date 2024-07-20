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
  
  function addPunch() {
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
  
  function redeemReward() {
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
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        history.forEach(entry => {
          const listItem = document.createElement('li');
          if (entry.type === 'punch') {
            listItem.innerText = `Activity: ${entry.activity} - Date: ${new Date(entry.date).toLocaleString()}`;
          } else if (entry.type === 'reward') {
            listItem.innerText = `Reward: ${entry.reward} - Date: ${new Date(entry.date).toLocaleString()}`;
          }
          historyList.appendChild(listItem);
        });
      })
      .catch(error => console.error('Error fetching history:', error));
  }
  