document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.style.color = "var(--success)";
            messageDiv.textContent = "Login successful! Redirecting...";
            
            // CRITICAL: Save the token and user details to localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to the main job feed page (we will build this next)
            setTimeout(() => {
                window.location.href = 'index.html'; 
            }, 1000);
        } else {
            // Handle wrong password or email
            messageDiv.style.color = "var(--danger)";
            messageDiv.textContent = data.message;
        }

    } catch (error) {
        console.error("Error:", error);
        messageDiv.style.color = "var(--danger)";
        messageDiv.textContent = "Cannot connect to server. Is the backend running?";
    }
});