document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
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
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/punch')
      .then(() => updateStatus())
      .catch(error => console.error('Error adding punch:', error));
  }
  
  function redeemReward() {
    fetch('https://my-gym-punchcard.kathyyliao.workers.dev/reward')
      .then(() => updateStatus())
      .catch(error => console.error('Error redeeming reward:', error));
  }

  