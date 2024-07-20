document.addEventListener('DOMContentLoaded', () => {
    fetchData();
  });
  
  const fetchData = async () => {
    const response = await fetch('/api/data');
    if (!response.ok) {
      console.error('Failed to fetch data');
      return;
    }
    const data = await response.json();
    updateStatus(data.status);
    updateHistory(data.history);
    updateAnalytics(data.history);
  };
  
  const addPunch = async () => {
    const activityDropdown = document.getElementById('activityDropdown');
    const activity = activityDropdown.value;
    const response = await fetch('/api/add-punch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity })
    });
    if (!response.ok) {
      console.error('Failed to add punch');
      return;
    }
    await fetchData();
  };
  
  const redeemReward = async () => {
    const rewardDropdown = document.getElementById('rewardDropdown');
    const reward = rewardDropdown.value;
    const response = await fetch('/api/redeem-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reward })
    });
    if (!response.ok) {
      console.error('Failed to redeem reward');
      return;
    }
    await fetchData();
  };
  
  const deleteEntry = async (id) => {
    const response = await fetch(`/api/delete-entry/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      console.error('Failed to delete entry');
      return;
    }
    await fetchData();
  };
  
  const updateStatus = (status) => {
    document.getElementById('currentPunches').textContent = status.currentPunches;
    document.getElementById('unredeemedPunchcards').textContent = status.unredeemedPunchcards;
    document.getElementById('redeemedPunchcards').textContent = status.redeemedPunchcards;
  };
  
  const updateHistory = (history) => {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    history.forEach(entry => {
      const listItem = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = `${new Date(entry.date).toLocaleDateString()} ${entry.type === 'punch' ? entry.activity : entry.reward}`;
      const editButton = document.createElement('button');
      editButton.className = 'edit';
      editButton.textContent = 'Edit';
      editButton.onclick = () => editEntry(entry.id);
      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete';
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => deleteEntry(entry.id);
      listItem.appendChild(text);
      listItem.appendChild(editButton);
      listItem.appendChild(deleteButton);
      historyList.appendChild(listItem);
    });
  };
  
  const updateAnalytics = (history) => {
    const activityCount = {};
    history.forEach(entry => {
      if (entry.type === 'punch') {
        activityCount[entry.activity] = (activityCount[entry.activity] || 0) + 1;
      }
    });
  
    const sortedActivities = Object.keys(activityCount).sort((a, b) => activityCount[b] - activityCount[a]);
    const chartLabels = sortedActivities;
    const chartData = sortedActivities.map(activity => activityCount[activity]);
  
    const ctx = document.getElementById('activityChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Activity Count',
          data: chartData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            stepSize: 1
          }
        }
      }
    });
  };
  
  const addGym = () => {
    const activityDropdown = document.getElementById('activityDropdown');
    activityDropdown.value = 'gym';
    addPunch();
  };
  
  const addPickleball = () => {
    const activityDropdown = document.getElementById('activityDropdown');
    activityDropdown.value = 'pickleball';
    addPunch();
  };
  
  const addYoga = () => {
    const activityDropdown = document.getElementById('activityDropdown');
    activityDropdown.value = 'yoga';
    addPunch();
  };
  
  const showHistory = () => {
    document.getElementById('history').classList.add('active');
    document.getElementById('analytics').classList.remove('active');
  };
  
  const showAnalytics = () => {
    document.getElementById('history').classList.remove('active');
    document.getElementById('analytics').classList.add('active');
  };
  