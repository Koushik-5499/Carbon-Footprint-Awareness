document.addEventListener('DOMContentLoaded', async () => {
    try {
        const profile = await apiCall('/api/auth/profile');
        
        document.getElementById('userName').textContent = profile.name;
        document.getElementById('userScore').textContent = profile.score;
        document.getElementById('challengesCompleted').textContent = profile.completedChallenges.length;

        // Set performance level
        const levelEl = document.getElementById('scoreLevel');
        levelEl.className = 'font-bold';
        if (profile.score > 500) {
            levelEl.textContent = 'Excellent 🌿';
            levelEl.classList.add('text-primary-green');
        } else if (profile.score > 200) {
            levelEl.textContent = 'Good 🍃';
            levelEl.classList.add('color-light-green');
        } else if (profile.score > 50) {
            levelEl.textContent = 'Average 🍂';
            levelEl.classList.add('color-orange');
        }

        const history = profile.footprintHistory || [];
        
        // Calculate impact metrics
        const dailyAverage = 4000 / 365;
        let totalSaved = 0;
        history.forEach(entry => {
            totalSaved += (dailyAverage - entry.total);
        });
        const equivalentTrees = totalSaved / 21;

        document.getElementById('savedCO2').textContent = totalSaved.toFixed(2);
        document.getElementById('equivalentTrees').textContent = Math.max(0, equivalentTrees).toFixed(2);
        
        if (history.length > 0) {
            const latest = history[history.length - 1];
            document.getElementById('latestFootprint').textContent = latest.total.toFixed(2);
            renderBreakdownChart(latest.emissions);
            renderTrendChart(history);
        } else {
            document.getElementById('latestFootprint').textContent = '0.00';
        }

    } catch (err) {
        console.error('Error loading dashboard:', err);
    }
});

function renderBreakdownChart(emissions) {
    const ctx = document.getElementById('breakdownChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Transport', 'Electricity', 'Water', 'Gas', 'Waste'],
            datasets: [{
                data: [
                    emissions.transport, 
                    emissions.electricity, 
                    emissions.water, 
                    emissions.gas, 
                    emissions.waste
                ],
                backgroundColor: [
                    '#4299E1', '#ECC94B', '#63B3ED', '#F56565', '#A0AEC0'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function renderTrendChart(history) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Get last 10 entries
    const recent = history.slice(-10);
    const labels = recent.map(r => new Date(r.date).toLocaleDateString());
    const data = recent.map(r => r.total);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total CO₂e (kg)',
                data: data,
                borderColor: '#3CB371',
                backgroundColor: 'rgba(60, 179, 113, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function downloadReport() {
    const element = document.getElementById('dashboardContent');
    const opt = {
        margin:       0.5,
        filename:     'EcoTrack-Report.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save();
}
