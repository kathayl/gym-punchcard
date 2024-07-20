const activityIcons = {
    gym: '🏋️‍♀️',
    pickleball: '🏓',
    yoga: '🧘‍♂️',
    walk: '🚶‍♂️',
    run: '🏃‍♂️',
    hike: '🥾',
    dance: '🩰',
    snowboarding: '🏂',
    stairs: '🪜',
    other: '🔄' // Default icon for other activities
  };
  
  const rewardIcons = {
    pie: '🥧',
    brownies: '🍫',
    cookies: '🍪',
    boba: '🧋',
    candy: '🍬',
    smoothies: '🥤',
    other: '🔄' // Default icon for other rewards
  };
  
  const updateStatus = (status) => {
    document.getElementById('currentPunches').innerText = `Current Punches: ${status.currentPunches}`;
    document.getElementById('unredeemedPunchcards').innerText = `Unredeemed Punchcards: ${status.unredeemedPunchcards}`;
    document.getElementById('redeemedPunchcards').innerText = `Redeemed Punchcards: ${status.redeemedPunchcards}`;
  };
  
  const updateHistory = (history) => {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = ''; // Clear current history
  
    history.forEach(entry => {
      const listItem = document.createElement('li');
      listItem.classList.add('history-item');
  
      const details = document.createElement('div');
      details.classList.add('history-details');
  
      const icon = document.createElement('span');
      icon.classList.add('icon');
  
      if (entry.type === 'punch') {
        icon.innerText = activityIcons[entry.activity] || activityIcons['other'];
        details.innerHTML = `${entry.date.split('T')[0]} - ${icon.outerHTML} ${entry.activity}`;
      } else if (entry.type === 'reward') {
        icon.innerText = rewardIcons[entry.reward] || rewardIcons['other'];
        details.innerHTML = `${entry.date.split('T')[0]} - ${icon.outerHTML} ${entry.reward}`;
      }
  
      listItem.appendChild(details);
  
      const buttons = document.createElement('div');
      buttons.classList.add('history-buttons');
      buttons.innerHTML = `<span class="edit-link" onclick="editEntry('${entry.id}')">Edit</span><span class="delete-link" onclick="deleteEntry('${entry.id}')">Delete</span>`;
  
      listItem.appendChild(buttons);
  
      historyList.appendChild(listItem);
    });
  };
  
  const updateAnalytics = (history) => {
    const ctx = document.getElementById('activityChart').getContext('2d');
    const activityCount = history.reduce((acc, entry) => {
      if (entry.type === 'punch') {
        acc[entry.activity] = (acc[entry.activity] || 0) + 1;
      }
      return acc;
    }, {});
  
    const sortedActivities = Object.entries(activityCount).sort((a, b) => b[1] - a[1]);
  
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedActivities.map(([activity, count]) => `${activity} (${count})`),
        datasets: [{
          label: 'Activity Count',
          data: sortedActivities.map(([_, count]) => count),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            precision: 0 // Ensure whole numbers
          }
        }
      }
    });
  };
  
  const fetchData = async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    updateStatus(data.status);
    updateHistory(data.history);
    updateAnalytics(data.history);
  };
  
  const addPunch = async () => {
    const activity = document.getElementById('activityDropdown').value;
    await fetch('/api/punch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activity })
    });
    fetchData();
  };
  
  const redeemReward = async () => {
    const reward = document.getElementById('rewardDropdown').value;
    await fetch('/api/reward', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reward })
    });
    fetchData();
  };
  
  const editEntry = async (id) => {
    // Implement edit functionality if needed
  };
  
  const deleteEntry = async (id) => {
    await fetch(`/api/history/${id}`, {
      method: 'DELETE'
    });
    fetchData();
  };
  
  const openTab = (evt, tabName) => {
    const tabContents = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
  
    tabContents.forEach(tabContent => {
      tabContent.classList.remove('active');
    });
  
    tabButtons.forEach(tabButton => {
      tabButton.classList.remove('active');
    });
  
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
  };
  
  // Populate dropdowns and activity buttons
  document.addEventListener('DOMContentLoaded', () => {
    const activityDropdown = document.getElementById('activityDropdown');
    const rewardDropdown = document.getElementById('rewardDropdown');
    const activityButtons = document.getElementById('activityButtons');
  
    Object.keys(activityIcons).forEach(activity => {
      if (activity !== 'other') {
        const option = document.createElement('option');
        option.value = activity;
        option.innerText = activity.charAt(0).toUpperCase() + activity.slice(1);
        activityDropdown.appendChild(option);
      }
    });
  
    Object.keys(rewardIcons).forEach(reward => {
      if (reward !== 'other') {
        const option = document.createElement('option');
        option.value = reward;
        option.innerText = reward.charAt(0).toUpperCase() + reward.slice(1);
        rewardDropdown.appendChild(option);
      }
    });
  
    ['gym', 'pickleball', 'yoga'].forEach(activity => {
      const button = document.createElement('button');
      button.innerHTML = `${activityIcons[activity]} ${activity.charAt(0).toUpperCase() + activity.slice(1)}`;
      button.onclick = () => {
        document.getElementById('activityDropdown').value = activity;
        addPunch();
      };
      activityButtons.appendChild(button);
    });
  
    fetchData();
  });
  