document.addEventListener('DOMContentLoaded', () => {
    updateStatus();
    fetchHistory();
    populateActivityButtons();
    populateDropdowns();
    openTab(null, 'analytics'); // Show the Analytics tab by default
  });
  
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
  
  // Existing JavaScript functions go here...
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
            beginAtZero: true,
            ticks: {
              stepSize: 1 // Ensure only whole numbers are displayed
            }
          }
        }
      }
    });
  }
  
  // Rest of your existing JavaScript functions...
  