document.addEventListener('DOMContentLoaded', async () => {
    const activityLogFeed = document.getElementById('activity-log-feed');
    const token = localStorage.getItem('token');

    if (!token) {
        activityLogFeed.innerHTML = '<p class="error-message">You must be logged in to view the activity log.</p>';
        return;
    }

    try {
        const response = await fetch('/api/activity/feed', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch activity log');
        }

        const activities = await response.json();

        if (activities.length === 0) {
            activityLogFeed.innerHTML = '<p class="loading-message">No activities to display yet.</p>';
            return;
        }

        activityLogFeed.innerHTML = ''; // Clear loading message

        activities.forEach(activity => {
            const activityEntry = document.createElement('div');
            activityEntry.classList.add('activity-entry');

            const timestamp = new Date(activity.timestamp).toLocaleString();

            activityEntry.innerHTML = `
                <div class="activity-entry-header">
                    <span class="timestamp">${timestamp}</span>
                    <span class="username">${activity.username}</span>
                </div>
                <span class="activity-entry-type">${activity.activity_type}</span>
                <p class="activity-entry-description">${activity.description}</p>
            `;
            activityLogFeed.appendChild(activityEntry);
        });

    } catch (error) {
        console.error('Error fetching activity log:', error);
        activityLogFeed.innerHTML = `<p class="error-message">Error loading activity log: ${error.message}</p>`;
    }
});

