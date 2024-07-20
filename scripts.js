// scripts.js
async function addPunch(activity) {
    try {
      const response = await fetch('/api/punch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ activity }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add punch');
      }
  
      updateStatus();
    } catch (error) {
      console.error(error);
    }
  }
  
  async function redeemReward(reward) {
    try {
      const response = await fetch('/api/reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reward }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to redeem reward');
      }
  
      updateStatus();
    } catch (error) {
      console.error(error);
    }
  }
  
  async function updateStatus() {
    try {
      const response = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
  
      const data = await response.json();
      document.getElementById('currentPunches').textContent = data.currentPunches;
      document.getElementById('unredeemedPunchcards').textContent = data.unredeemedPunchcards;
      document.getElementById('redeemedPunchcards').textContent = data.redeemedPunchcards;
    } catch (error) {
      console.error(error);
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
  
    document.getElementById('add-punch-btn').addEventListener('click', () => {
      const activity = document.getElementById('activity-dropdown').value;
      addPunch(activity);
    });
  
    document.getElementById('redeem-reward-btn').addEventListener('click', () => {
      const reward = document.getElementById('reward-dropdown').value;
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
  });
  