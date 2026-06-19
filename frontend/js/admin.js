document.addEventListener('DOMContentLoaded', async () => {
    loadStats();
});

async function loadStats() {
    try {
        const stats = await apiCall('/api/admin/stats');
        
        document.getElementById('statUsers').textContent = stats.totalUsers;
        document.getElementById('statEmissions').textContent = `${stats.totalEmissions} kg`;
        document.getElementById('statCompleted').textContent = stats.totalChallengesCompleted;
        document.getElementById('statChallenges').textContent = stats.totalChallenges;

        const tbody = document.querySelector('#usersTable tbody');
        tbody.innerHTML = '';
        
        stats.users.forEach(user => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            tr.innerHTML = `
                <td style="padding: 0.5rem; font-weight: 500;">${user.name}</td>
                <td style="padding: 0.5rem; color: var(--text-secondary);">${user.email}</td>
                <td style="padding: 0.5rem; text-align: right;">${user.entriesCount}</td>
                <td style="padding: 0.5rem; text-align: right; font-weight: bold; color: var(--primary-green);">${user.score}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        showAlert('adminAlert', 'Failed to load admin statistics', 'error');
    }
}

document.getElementById('createChallengeForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        title: document.getElementById('challengeTitle').value,
        description: document.getElementById('challengeDesc').value,
        points: document.getElementById('challengePoints').value,
        type: document.getElementById('challengeType').value
    };

    try {
        await apiCall('/api/admin/challenges', 'POST', data);
        showAlert('adminAlert', 'Challenge created successfully!', 'success');
        document.getElementById('createChallengeForm').reset();
        loadStats();
    } catch (err) {
        showAlert('adminAlert', err.message, 'error');
    }
});
