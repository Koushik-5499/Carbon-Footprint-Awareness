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
            tr.style.borderBottom = '1px solid rgba(0,0,0,0.05)';
            
            tr.innerHTML = `
                <td style="padding: 1rem; font-weight: bold;">${icon}${rankDisplay}</td>
                <td style="padding: 1rem; font-weight: 500;">${user.name}</td>
                <td style="padding: 1rem; text-align: right; font-weight: bold; color: var(--primary-green);">${user.score}</td>
            `;
            
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Error loading leaderboard:', err);
    }
});
