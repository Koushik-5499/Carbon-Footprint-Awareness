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
        card.className = 'glass-panel relative';
        
        if (isCompleted) {
            card.classList.add('completed-card');
        }

        card.innerHTML = `
            ${isCompleted ? '<div class="check-badge"><i class="fa-solid fa-check"></i></div>' : ''}
            <span class="challenge-tag">${challenge.type.toUpperCase()}</span>
            <h3 class="mt-1">${challenge.title}</h3>
            <p class="challenge-desc">${challenge.description}</p>
            <div class="flex-between-center">
                <span class="points-badge"><i class="fa-solid fa-star"></i> ${challenge.points} pts</span>
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
