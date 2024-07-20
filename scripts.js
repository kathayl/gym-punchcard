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
        console.log('Fetched history:', history); // Debugging log
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        history.reverse(); // Reverse the history array to show newest first
        history.forEach(entry => {
          const listItem = document.createElement('li');
          const date = new Date(entry.date).toLocaleDateString();
          listItem.innerHTML = entry.type === 'punch' ? `${date} - ${entry.activity}` : `${date} - ${entry.reward}`;
          listItem.classList.toggle('reward', entry.type === 'reward');
  
          // Add edit link
          const editLink = document.createElement('span');
          editLink.innerHTML = 'Edit';
          editLink.classList.add('edit-link');
          editLink.onclick = () => editLog(entry.id, entry.activity);
  
          // Add delete link
          const deleteLink = document.createElement('span');
          deleteLink.innerHTML = 'Delete';
          deleteLink.classList.add('delete-link');
          deleteLink.onclick = () => {
            if (confirm('Are you sure you want to delete this log?')) {
              deleteLog(entry.id);
            }
          };
  
          listItem.appendChild(editLink);
          listItem.appendChild(deleteLink);
  
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
  