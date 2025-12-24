document.getElementById('whitelistForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('button[type="submit"]');
    const alertBox = document.getElementById('alertBox');

    // Disable button to prevent double submit
    submitBtn.disabled = true;
    submitBtn.innerText = 'Sending...';

    // Collect Data
    const formData = {
        fullName: document.getElementById('fullName').value,
        discordUser: document.getElementById('discordUser').value,
        discordId: document.getElementById('discordId').value,
        age: document.getElementById('age').value,
        country: document.getElementById('country').value,
        experience: document.getElementById('experience').value,
        reason: document.getElementById('reason').value,
        timestamp: new Date().toISOString()
    };

    // Client-side spam check (simple localStorage)
    const lastSubmit = localStorage.getItem('lastWhitelistSubmit');
    if (lastSubmit && (Date.now() - new Date(lastSubmit).getTime() < 300000)) { // 5 minutes
        showAlert('Please wait 5 minutes before submitting another request.', 'error');
        resetBtn();
        return;
    }

    try {
        const response = await fetch('/api/apply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Your application has been submitted successfully! We will contact you via Discord.', 'success');
            localStorage.setItem('lastWhitelistSubmit', new Date());
            document.getElementById('whitelistForm').reset();
        } else {
            showAlert(result.message || 'An error occurred during submission. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to connect to the server. Please check your internet connection and try again.', 'error');
    }

    resetBtn();

    function resetBtn() {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Submit Application';
    }

    function showAlert(message, type) {
        alertBox.style.display = 'block';
        alertBox.textContent = message;
        alertBox.className = 'alert ' + (type === 'success' ? 'alert-success' : 'alert-error');

        // Auto hide after 5 seconds
        setTimeout(() => {
            alertBox.style.display = 'none';
        }, 5000);
    }
});
