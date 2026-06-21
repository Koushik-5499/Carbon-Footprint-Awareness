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
            tr.className = 'table-row-border';
            tr.innerHTML = `
                <td class="td-left-bold">${window.escapeHTML(user.name)}</td>
                <td class="td-sec">${window.escapeHTML(user.email)}</td>
                <td class="td-right">${user.entriesCount}</td>
                <td class="td-right-bold">${user.score}</td>
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
