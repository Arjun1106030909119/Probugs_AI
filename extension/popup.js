document.addEventListener('DOMContentLoaded', async () => {
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');
    const sourceUrlInput = document.getElementById('source-url');
    const bugTitleInput = document.getElementById('bug-title');
    const severitySelect = document.getElementById('severity');
    const descriptionTextarea = document.getElementById('description');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const reportAnotherBtn = document.getElementById('report-another-btn');
    const visitBtn = document.getElementById('visit-btn');
    
    // 1. Capture current URL
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
            sourceUrlInput.value = tab.url;
        }
    } catch (error) {
        console.error('Error fetching tab URL:', error);
    }

    // 2. Form Submission
    submitBtn.addEventListener('click', async () => {
        const payload = {
            title: bugTitleInput.value,
            description: descriptionTextarea.value,
            priority: severitySelect.value, // Map to field expected by model
            sourceUrl: sourceUrlInput.value,
            status: 'Open'
        };

        if (!payload.title || !payload.description) {
            alert('Please fill out all fields.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const response = await fetch('http://localhost:5000/api/tickets', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-extension-source': 'probugs-extension' // Bypass auth via Guest user
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                // Use the REAL ticketId from the database (e.g., TK-1004)
                showSuccessView(result.data.ticketId);
            } else {
                throw new Error(result.error || 'Failed to submit report');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit Report <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
        }
    });

    // 3. View Transitions
    function showSuccessView(ticketId) {
        document.querySelector('.ticket-id span').textContent = ticketId;
        formView.classList.add('hidden');
        successView.classList.remove('hidden');
    }

    reportAnotherBtn.addEventListener('click', () => {
        bugTitleInput.value = '';
        descriptionTextarea.value = '';
        successView.classList.add('hidden');
        formView.classList.remove('hidden');
    });

    // 4. Navigation
    visitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'http://localhost:3000' }); // Frontend is on port 3000
    });

    cancelBtn.addEventListener('click', () => {
        window.close();
    });
});
