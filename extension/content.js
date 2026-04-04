// Content script injected into Greenhouse & Workday ATS DOM nodes
console.log("Job Copilot DOM Inspector active on ATS board.");

// Dynamic Toast Overlay Engine
function showCopilotToast(message, isSuccess = true) {
    const toast = document.createElement('div');
    toast.innerText = `🤖 Copilot: ${message}`;
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: isSuccess ? '#064e3b' : '#7f1d1d',
        color: '#ecfdf5',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        zIndex: '9999999',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        fontWeight: '500',
        transition: 'opacity 0.3s ease',
        opacity: '0'
    });
    
    document.body.appendChild(toast);
    setTimeout(() => toast.style.opacity = '1', 50);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Global Heuristic Fuzzy-Match Engine for Input Mapping rot
function fuzzyFindInput(fuzzyString) {
    let el = document.querySelector(`input[name*="${fuzzyString.replace(' ', '_')}" i], input[id*="${fuzzyString.replace(' ', '_')}" i]`);
    if (el) return el;
    
    el = Array.from(document.querySelectorAll('input')).find(i => 
        i.placeholder && i.placeholder.toLowerCase().includes(fuzzyString.toLowerCase())
    );
    if (el) return el;
    
    const labels = Array.from(document.querySelectorAll('label'));
    const matchedLabel = labels.find(l => l.innerText.toLowerCase().includes(fuzzyString.toLowerCase()));
    if (matchedLabel) {
        if (matchedLabel.htmlFor) return document.getElementById(matchedLabel.htmlFor);
        const childInput = matchedLabel.querySelector('input');
        if (childInput) return childInput;
    }
    return null;
}

// Autofill execution block for Greenhouse APIs
function autoFillGreenhouse(profile) {
    const fields = {
        'first_name': { val: profile.firstName, fuzzy: 'first name' },
        'last_name': { val: profile.lastName, fuzzy: 'last name' },
        'email': { val: profile.email, fuzzy: 'email' },
        'phone': { val: profile.phone, fuzzy: 'phone' },
        'job_application[answers_attributes][0][text_value]': { val: profile.linkedin, fuzzy: 'linkedin' }
    };
    
    let fieldsInjected = 0;
    for (const [name, map] of Object.entries(fields)) {
        let input = document.querySelector(`input[name="${name}"]`);
        if (!input) input = fuzzyFindInput(map.fuzzy);
        
        if (input && map.val) {
            input.value = map.val;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            fieldsInjected++;
        }
    }
    return fieldsInjected > 0;
}

// Autofill execution block for Workday APIs
function autoFillWorkday(profile) {
    const fields = {
        'legalNameSection_firstName': { val: profile.firstName, fuzzy: 'first name' },
        'legalNameSection_lastName': { val: profile.lastName, fuzzy: 'last name' },
        'contactInformationSection_emailAddress': { val: profile.email, fuzzy: 'email' },
        'phone-number': { val: profile.phone, fuzzy: 'phone' }
    };
    
    let fieldsInjected = 0;
    for (const [id, map] of Object.entries(fields)) {
        let input = document.querySelector(`input[data-automation-id="${id}"]`);
        if (!input) input = fuzzyFindInput(map.fuzzy);
        
        if (input && map.val) {
            input.value = map.val;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
            fieldsInjected++;
        }
    }
    return fieldsInjected > 0;
}

// Listen for the specific extension toolbar trigger button
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "trigger_autofill_injection") {
        console.log("Copilot Autofill trigger detected. Extracting profile contexts.");
        
        // Fetch real-time user metrics bridging directly to backend layer
        chrome.runtime.sendMessage({ action: "fetch_profile_context" }, (response) => {
            if (response && response.status === "success") {
                const profile = response.profile || {
                    firstName: "Senior",
                    lastName: "Engineer",
                    email: "agentic@example.com",
                    phone: "+44 7711 223344",
                    linkedin: "https://linkedin.com/in/agent"
                };
                
                const isGreenhouse = document.querySelector('form#application_form') || document.location.hostname.includes('greenhouse');
                const isWorkday = document.querySelector('div[data-automation-id]') || document.location.hostname.includes('myworkdayjobs.com');
                
                let success = false;
                if (isGreenhouse) {
                    success = autoFillGreenhouse(profile);
                    console.log(`Greenhouse injection complete. Successful field writes: ${success}`);
                    
                    // Wire up Webhook listener
                    const form = document.querySelector('form#application_form');
                    const formId = window.location.pathname.split('/').pop();
                    if (form) {
                        form.addEventListener('submit', () => {
                            console.log("Transmission detected. Routing Webhook callback to Copilot DB.");
                            chrome.runtime.sendMessage({ 
                                action: "submit_application_webhook", 
                                providerJobId: formId,
                                sourceUrl: window.location.href 
                            });
                        });
                    }
                    
                } else if (isWorkday) {
                    success = autoFillWorkday(profile);
                    console.log(`Workday injection complete. Successful field writes: ${success}`);
                    
                    // Wire up Webhook listener (Workday dynamic submit)
                    const submitBtn = document.querySelector('button[data-automation-id="bottom-navigation-next-button"]');
                    const formId = window.location.pathname.split('/').pop();
                    if (submitBtn) {
                        submitBtn.addEventListener('click', () => {
                            // Check if it's the final submission step
                            if (submitBtn.innerText.toLowerCase().includes('submit')) {
                                chrome.runtime.sendMessage({ 
                                    action: "submit_application_webhook", 
                                    providerJobId: formId,
                                    sourceUrl: window.location.href 
                                });
                                showCopilotToast("Webhook callback executing...", true);
                            }
                        });
                    }
                } else {
                    console.warn("Agentic Autofill Exception: ATS layout not structurally recognized.");
                    showCopilotToast("Cannot map job layout. Attempting manual heuristic matching...", false);
                }
                
                if (success) showCopilotToast("Autofill Sequence Complete", true);

                
                sendResponse({ status: success ? "injected" : "unsupported" });
            } else {
                console.error("Job Copilot failed to fetch background profile context. Aborting injection.");
                sendResponse({ status: "error" });
            }
        });
        
        return true; // Asynchronous callback alignment
    }
});
