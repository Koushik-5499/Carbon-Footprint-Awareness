document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [challenges, profile] = await Promise.all([
            apiCall('/api/challenges'),
            apiCall('/api/auth/profile')
        ]);
        
        renderChallenges(challenges, profile.completedChallenges);
    } catch (err) {
        showAlert('challengeAlert', 'Failed to load challenges', 'error');
    }
});

function renderChallenges(challenges, completedIds) {
    const container = document.getElementById('challengesContainer');
    container.innerHTML = '';

    challenges.forEach(challenge => {
        const isCompleted = completedIds.includes(challenge.id);
        
        const card = document.createElement('div');
        card.className = 'glass-panel';
        card.style.position = 'relative';
        
        if (isCompleted) {
            card.style.opacity = '0.7';
        }

        card.innerHTML = `
            ${isCompleted ? '<div style="position:absolute; top:-10px; right:-10px; background:var(--primary-green); color:white; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center;"><i class="fa-solid fa-check"></i></div>' : ''}
            <span style="background: var(--bg-main); color: var(--primary-green); padding: 0.2rem 0.5rem; border-radius: 8px; font-size: 0.8rem; font-weight: bold;">${challenge.type.toUpperCase()}</span>
            <h3 class="mt-1">${challenge.title}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 1rem; min-height: 40px;">${challenge.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; color: var(--accent-color);"><i class="fa-solid fa-star"></i> ${challenge.points} pts</span>
                <button class="btn btn-${isCompleted ? 'secondary' : 'primary'}" 
                        ${isCompleted ? 'disabled' : ''} 
                        onclick="completeChallenge('${challenge.id}')">
                    ${isCompleted ? 'Completed' : 'Do It!'}
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function completeChallenge(id) {
    try {
        const res = await apiCall('/api/challenges/complete', 'POST', { challengeId: id });
        showAlert('challengeAlert', `Challenge completed! +${res.pointsEarned} points`, 'success');
        
        // Reload challenges
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (err) {
        showAlert('challengeAlert', err.message, 'error');
    }
}
