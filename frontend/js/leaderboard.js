document.addEventListener('DOMContentLoaded', async () => {
    try {
        const topUsers = await apiCall('/api/leaderboard');
        const tbody = document.getElementById('leaderboardBody');
        
        tbody.innerHTML = '';
        
        topUsers.forEach((user, index) => {
            let rankDisplay = index + 1;
            let icon = '';
            
            if (index === 0) {
                icon = '<i class="fa-solid fa-trophy" style="color: gold;"></i> ';
            } else if (index === 1) {
                icon = '<i class="fa-solid fa-medal" style="color: silver;"></i> ';
            } else if (index === 2) {
                icon = '<i class="fa-solid fa-medal" style="color: #cd7f32;"></i> ';
            }

            const tr = document.createElement('tr');
            tr.className = 'table-row-border';
            
            tr.innerHTML = `
                <td class="td-rank">${icon}${rankDisplay}</td>
                <td class="td-user">${window.escapeHTML(user.name)}</td>
                <td class="td-score">${user.score}</td>
            `;
            
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error loading leaderboard:', err);
    }
});
