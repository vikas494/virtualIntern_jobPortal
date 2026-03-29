document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload

    // Get values from the form
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const skillsInput = document.getElementById('skills').value;
    const role = document.getElementById('role').value;
    const messageDiv = document.getElementById('message');

    // Convert comma-separated skills into an array, clean up extra spaces
    const skills = skillsInput.split(',').map(skill => skill.trim()).filter(skill => skill !== "");

    try {
        // Call our Node.js Backend API
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, skills, role })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.style.color = "var(--success)";
            messageDiv.textContent = "Registration successful! Redirecting to login...";
            
            // Wait 2 seconds, then go to login page
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            // Handle backend errors (e.g., "User already exists")
            messageDiv.style.color = "var(--danger)";
            messageDiv.textContent = data.message;
        }

    } catch (error) {
        console.error("Error:", error);
        messageDiv.style.color = "var(--danger)";
        messageDiv.textContent = "Cannot connect to server. Is the backend running?";
    }
});