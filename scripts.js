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
    document.getElementById('redeemButton').disabled = status.unredeemedPunchcards === 0;
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
    const activityDropdown = document.getElementById('activityDropdown');
    const activity = activityDropdown.value;
    await fetch('/api/add-punch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activity })
    });
    await fetchData();
  };
  
  const redeemReward = async () => {
    const rewardDropdown = document.getElementById('rewardDropdown');
    const reward = rewardDropdown.value;
    await fetch('/api/redeem-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reward })
    });
    await fetchData();
  };
  
  const deleteEntry = async (id) => {
    await fetch(`/api/delete-entry/${id}`, { method: 'DELETE' });
    await fetchData();
  };
  
  const editEntry = (id) => {
    // Edit functionality can be implemented here
  };
  
  const openTab = (event, tabName) => {
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
      tabContents[i].style.display = 'none';
    }
  
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
      tabButtons[i].classList.remove('active');
    }
  
    document.getElementById(tabName).style.display = 'block';
    event.currentTarget.classList.add('active');
  };
  
  const initDropdowns = () => {
    const activityDropdown = document.getElementById('activityDropdown');
    const rewardDropdown = document.getElementById('rewardDropdown');
  
    const activityOptions = ['walk', 'run', 'hike', 'dance', 'snowboarding', 'stairs', 'other'];
    const rewardOptions = ['pie', 'brownies', 'cookies', 'boba', 'candy', 'smoothies', 'other'];
  
    activityOptions.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.innerHTML = `${activityIcons[option]} ${option.charAt(0).toUpperCase() + option.slice(1)}`;
      activityDropdown.appendChild(opt);
    });
  
    rewardOptions.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option;
      opt.innerHTML = `${rewardIcons[option]} ${option.charAt(0).toUpperCase() + option.slice(1)}`;
      rewardDropdown.appendChild(opt);
    });
  };
  
  document.addEventListener('DOMContentLoaded', async () => {
    initDropdowns();
    await fetchData();
  });
  