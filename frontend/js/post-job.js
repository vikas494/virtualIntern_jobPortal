// --- 1. Security Check ---
const token = localStorage.getItem('token');
const userString = localStorage.getItem('user');

// Kick out anyone who isn't logged in
if (!token || !userString) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userString);

// Kick out regular users (only admins can post jobs)
if (user.role !== 'admin') {
    alert('Access Denied: Only company admins can post jobs.');
    window.location.href = 'index.html';
}

// --- 2. Handle Form Submission ---
document.getElementById('postJobForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const company = document.getElementById('company').value;
    const skillsInput = document.getElementById('skills_required').value;
    const description = document.getElementById('description').value;
    const messageDiv = document.getElementById('message');

    // Convert comma-separated skills into a clean array
    const skills_required = skillsInput.split(',').map(skill => skill.trim()).filter(skill => skill !== "");

    try {
        const response = await fetch('http://localhost:5000/api/jobs/add-job', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                company,
                skills_required,
                description,
                postedBy: user.id // We attach the admin's ID to the job
            })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.style.color = "var(--success)";
            messageDiv.textContent = "Job posted successfully! Redirecting to feed...";
            
            // Go back to the main feed after 1.5 seconds to see the new job
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            messageDiv.style.color = "var(--danger)";
            messageDiv.textContent = data.message || "Failed to post job.";
        }

    } catch (error) {
        console.error("Error:", error);
        messageDiv.style.color = "var(--danger)";
        messageDiv.textContent = "Cannot connect to server.";
    }
});