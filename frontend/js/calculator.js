document.getElementById('calculatorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        transport: parseFloat(document.getElementById('transport').value) || 0,
        electricity: parseFloat(document.getElementById('electricity').value) || 0,
        water: parseFloat(document.getElementById('water').value) || 0,
        gas: parseFloat(document.getElementById('gas').value) || 0,
        waste: parseFloat(document.getElementById('waste').value) || 0
    };

    try {
        const res = await apiCall('/api/calculator', 'POST', data);
        
        document.getElementById('resultTotal').textContent = res.record.total.toFixed(2);
        document.getElementById('scoreUpdate').textContent = `+ Points Added! New Score: ${res.newScore}`;
        
        showAlert('calcAlert', 'Data saved successfully!', 'success');
        document.getElementById('calculatorForm').reset();
        
    } catch (err) {
        showAlert('calcAlert', err.message, 'error');
    }
});
