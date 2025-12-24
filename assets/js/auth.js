// Handle Login Form
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const authAlert = document.getElementById('authAlert');
        const submitBtn = this.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (response.ok) {
                showAlert('Login successful! Redirecting...', 'success');
                // Store JWT token and User info
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                showAlert(result.error || result.message || 'Invalid username or password.', 'error');
            }
        } catch (error) {
            console.error('Login Error:', error);
            showAlert('Failed to connect to server.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Initialize Session <i class="fas fa-arrow-right"></i>';
        }

        function showAlert(message, type) {
            authAlert.style.display = 'block';
            authAlert.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${message}`;
            authAlert.style.background = type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            authAlert.style.color = type === 'success' ? '#4ade80' : '#ef4444';
            authAlert.style.border = `1px solid ${type === 'success' ? '#4ade8055' : '#ef444455'}`;
            authAlert.style.padding = '15px';
            authAlert.style.borderRadius = '12px';
            authAlert.style.marginBottom = '20px';
            authAlert.style.fontSize = '0.9rem';
        }
    });
}

// Handle Register Form
if (document.getElementById('registerForm')) {
    document.getElementById('registerForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const gender = document.getElementById('gender').value;
        const age = document.getElementById('age').value;
        const skin = document.getElementById('skin').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const authAlert = document.getElementById('authAlert');
        const submitBtn = this.querySelector('button[type="submit"]');

        if (password !== confirmPassword) {
            showAlert('Passwords do not match.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing Genesis...';

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, gender, age, skin })
            });

            const result = await response.json();

            if (response.ok) {
                showAlert('Account created! You can now login.', 'success');
                setTimeout(() => window.location.href = 'login.html', 2000);
            } else {
                showAlert(result.message || result.error || 'Registration failed.', 'error');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            showAlert('Failed to connect to server.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Initialize Genesis <i class="fas fa-fingerprint"></i>';
        }

        function showAlert(message, type) {
            authAlert.style.display = 'block';
            authAlert.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'}"></i> ${message}`;
            authAlert.style.background = type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            authAlert.style.color = type === 'success' ? '#4ade80' : '#ef4444';
            authAlert.style.border = `1px solid ${type === 'success' ? '#4ade8055' : '#ef444455'}`;
            authAlert.style.padding = '15px';
            authAlert.style.borderRadius = '12px';
            authAlert.style.marginBottom = '20px';
            authAlert.style.fontSize = '0.9rem';
        }
    });
}

// Check Session & Update Header
document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (user && token) {
        const navAuth = document.getElementById('authHeader');
        if (navAuth) {
            navAuth.innerHTML = `
                <div class="auth-panel">
                    <a href="myspace.html" class="btn-myspace">
                        <i class="fas fa-user-circle"></i> My Space
                    </a>
                    <span class="user-tag">
                        ${user.username}
                    </span>
                    <a href="javascript:void(0)" onclick="logout()" class="btn-terminate">Terminate</a>
                </div>
            `;

            // Mobile Support
            const mobileAuth = document.getElementById('mobileAuth');
            if (mobileAuth) {
                mobileAuth.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 10px; padding: 20px 0;">
                        <a href="myspace.html" class="btn-myspace" style="width: 100%; justify-content: center;">My Space</a>
                        <center><span class="user-tag">${user.username}</span></center>
                        <a href="javascript:void(0)" onclick="logout()" class="btn-terminate" style="text-align: center;">Terminate</a>
                    </div>
                `;
            }
        }
    }
});

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
