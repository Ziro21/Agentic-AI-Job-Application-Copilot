// Chrome Extension V3 Service Worker
console.log("Job Copilot Service Worker successfully booted.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetch_profile_context") {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['access_token'], function(result) {
                if (!result.access_token) {
                    sendResponse({ status: "error", message: "User not authenticated." });
                    return;
                }
                // Return payload stub. In-production would hit /api/v1/users/me
                sendResponse({ 
                    status: "success", 
                    profile: {
                        firstName: "Autonomous",
                        lastName: "Agent",
                        email: "expert@copilot.agentic",
                        phone: "+44 7000 123456",
                        linkedin: "https://linkedin.com/in/automated"
                    } 
                });
            });
        }
        return true; 
    }

    if (request.action === "submit_application_webhook") {
        // Intercepted ATS submission trigger
        const { providerJobId, sourceUrl } = request;
        console.log(`Intercepted external application context: ${providerJobId} from ${sourceUrl}`);
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['access_token'], async function(result) {
                if (!result.access_token) return sendResponse({ status: "error" });
                
                try {
                    // Step 1: Look up the Copilot UUID using standard Search query 
                    const searchRes = await fetch(`http://127.0.0.1:8000/api/v1/jobs?q=${providerJobId}`, {
                        headers: { 'Authorization': `Bearer ${result.access_token}` }
                    });
                    
                    const searchData = await searchRes.json();
                    if (!searchData.items || searchData.items.length === 0) {
                        return sendResponse({ status: "error", message: "Job not tracked in Copilot database." });
                    }
                    
                    const copilotUuid = searchData.items[0].id;
                    
                    // Step 2: Trigger Webhook callback to explicitly shift Application status
                    const webhookRes = await fetch(`http://127.0.0.1:8000/api/v1/jobs/${copilotUuid}/application`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${result.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            status: "applied",
                            notes: "Autonomous zero-click submission via Chrome Extension.",
                            custom_fields: { source: "automation_engine_v1", provider_id: providerJobId }
                        })
                    });
                    
                    if (webhookRes.ok) {
                        console.log(`Copilot ATS engine securely logged submission for ${copilotUuid}`);
                        sendResponse({ status: "success" });
                    } else {
                        sendResponse({ status: "failed", error: "Backend webhook processing failed." });
                    }
                } catch (e) {
                    console.error("Critical webhook bridge failure:", e);
                    sendResponse({ status: "error", error: e.message });
                }
            });
        }
        return true;
    }
});
