// Front-end panel event handlers
document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const autofillView = document.getElementById('autofill-view');
    const fillBtn = document.getElementById('trigger-fill');
    const loginBtn = document.getElementById('trigger-login');
    const statusDiv = document.getElementById('status');

    // Bootstrap check
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['access_token'], function(result) {
            if (result.access_token) {
                loginView.classList.add('hidden');
                autofillView.classList.remove('hidden');
                statusDiv.innerText = "Identity Bound. Awaiting injection command.";
            }
        });
    }

    loginBtn.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        statusDiv.innerText = "Authenticating with http://127.0.0.1:8000...";
        
        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);
            
            const res = await fetch("http://127.0.0.1:8000/api/v1/users/login", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData
            });
            
            if (res.ok) {
                const data = await res.json();
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.set({ access_token: data.access_token }, () => {
                        loginView.classList.add('hidden');
                        autofillView.classList.remove('hidden');
                        statusDiv.innerText = "Verification core active.";
                    });
                }
            } else {
                statusDiv.innerText = `Auth Error: ${res.status}`;
            }
        } catch (e) {
            statusDiv.innerText = `Network Error: Backend unreachable.`;
        }
    });

    fillBtn.addEventListener('click', () => {
        statusDiv.innerText = "Initiating payload logic...";
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {action: "trigger_autofill_injection"}, function(response) {
                    if (chrome.runtime.lastError) {
                        statusDiv.innerText = "Error: Please navigate to a supported Greenhouse/Workday page first.";
                    } else {
                        statusDiv.innerText = "Successful injection signal detected.";
                    }
                });
            });
        }
    });
});
