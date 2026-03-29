// --- 1. Security Check ---
const token = localStorage.getItem('token');
const userString = localStorage.getItem('user');

if (!token || !userString) {
    window.location.href = 'login.html';
}

const user = JSON.parse(userString);

// --- 2. Populate Profile Info ---
document.getElementById('userName').textContent = user.name;
document.getElementById('userRole').textContent = `Account Type: ${user.role === 'admin' ? 'Company (Admin)' : 'Job Seeker'}`;

// --- 3. Fetch Applications (Smart Logic for User vs Admin) ---
const applicationsContainer = document.getElementById('applicationsContainer');

async function fetchDashboardData() {
    try {
        applicationsContainer.innerHTML = ''; // Clear loading text

        // ==========================================
        // ADMIN VIEW: See people who applied to jobs
        // ==========================================
        if (user.role === 'admin') {
            document.querySelector('h3').textContent = 'Manage Candidates';
            
            const response = await fetch(`http://localhost:5000/api/applications/admin/${user.id}`);
            const candidates = await response.json();

            if (candidates.length === 0) {
                applicationsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No one has applied to your jobs yet.</p>';
                return;
            }

            candidates.forEach(app => {
                const applicant = app.user_id;
                const job = app.job_id;
                if (!applicant || !job) return;

                const skillsHtml = applicant.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');

                const appCard = document.createElement('div');
                appCard.className = 'job-card';
                appCard.innerHTML = `
                    <div class="job-info">
                        <h3>Candidate: ${applicant.name}</h3>
                        <p><strong>Applied for:</strong> ${job.title}</p>
                        <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">Email: ${applicant.email}</p>
                        <div style="margin-bottom: 0.5rem;">${skillsHtml}</div>
                    </div>
                    <div class="job-action" style="text-align: right;">
                        <span class="badge badge-${app.status}" style="display: block; margin-bottom: 0.5rem;">${app.status}</span>
                        
                        ${app.status === 'pending' ? `
                            <button class="btn approve-btn" data-appid="${app._id}" style="background-color: var(--success); width: auto; font-size: 0.75rem; padding: 0.25rem 0.5rem; margin-bottom: 0.25rem;">Approve</button>
                            <button class="btn reject-btn" data-appid="${app._id}" style="background-color: var(--danger); width: auto; font-size: 0.75rem; padding: 0.25rem 0.5rem;">Reject</button>
                        ` : ''}
                    </div>
                `;
                applicationsContainer.appendChild(appCard);
            });

            attachStatusListeners();
        } 
        
        // ==========================================
        // USER VIEW: See jobs I applied for
        // ==========================================
        else {
            const response = await fetch(`http://localhost:5000/api/applications/user/${user.id}`);
            const applications = await response.json();

            if (applications.length === 0) {
                applicationsContainer.innerHTML = `
                    <div class="card" style="text-align: center;">
                        <p style="color: var(--text-muted); margin-bottom: 1rem;">You haven't applied to any jobs yet.</p>
                        <button onclick="window.location.href='index.html'" class="btn" style="width: auto;">Browse Jobs</button>
                    </div>
                `;
                return;
            }

            applications.forEach(app => {
                const job = app.job_id; 
                if (!job) return; 

                const appCard = document.createElement('div');
                appCard.className = 'job-card';
                appCard.innerHTML = `
                    <div class="job-info">
                        <h3>${job.title}</h3>
                        <p>${job.company}</p>
                        <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">
                            Applied on: ${new Date(app.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div class="job-action" style="text-align: right;">
                        <span class="badge badge-${app.status}" style="display: block; margin-bottom: 0.5rem;">${app.status}</span>
                        
                        ${app.status === 'pending' ? `
                            <button class="btn cancel-btn" data-appid="${app._id}" style="background-color: var(--danger); width: auto; font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                                Cancel Application
                            </button>
                        ` : ''}
                    </div>
                `;
                applicationsContainer.appendChild(appCard);
            });

            // Keep your existing cancel listener
            if (typeof attachCancelListeners === 'function') {
                attachCancelListeners();
            }
        }

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        applicationsContainer.innerHTML = '<p style="color: var(--danger);">Failed to load data.</p>';
    }
}

// Call the new function name
fetchDashboardData();


// function to cancle application
function attachCancelListeners() {
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    
    cancelButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            // Confirm before deleting
            if (!confirm('Are you sure you want to cancel this application? This cannot be undone.')) {
                return;
            }
            
            const appId = e.target.getAttribute('data-appid');
            
            try {
                const response = await fetch(`http://localhost:5000/api/applications/${appId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    // Refresh the dashboard to remove the cancelled application
                    fetchMyApplications(); 
                } else {
                    const data = await response.json();
                    alert(data.message || 'Failed to cancel application.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Server error while cancelling.');
            }
        });
    });
}

// --- 4. Handle Approving/Rejecting Applications (Admins Only) ---
function attachStatusListeners() {
    // Handle Approve Buttons
    const approveButtons = document.querySelectorAll('.approve-btn');
    approveButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to ACCEPT this candidate? An email will be sent to them.')) return;
            updateStatus(e.target.getAttribute('data-appid'), 'accepted');
        });
    });

    // Handle Reject Buttons
    const rejectButtons = document.querySelectorAll('.reject-btn');
    rejectButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            if (!confirm('Are you sure you want to REJECT this candidate? An email will be sent to them.')) return;
            updateStatus(e.target.getAttribute('data-appid'), 'rejected');
        });
    });
}

// Reusable function to make the API call
async function updateStatus(appId, newStatus) {
    try {
        const response = await fetch(`http://localhost:5000/api/applications/${appId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            alert(`Application successfully ${newStatus}!`);
            fetchDashboardData(); // Refresh the dashboard to see the new badge
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to update status.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Server error while updating status.');
    }
}