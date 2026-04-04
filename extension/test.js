const { JSDOM } = require('jsdom');
const fs = require('fs');

const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <form id="application_form">
        <input name="first_name" />
        <input name="last_name" />
        <button id="submit">Apply</button>
      </form>
    </body>
  </html>
`, { url: "https://boards.greenhouse.io/test/jobs/12398472" });

global.document = dom.window.document;
global.window = dom.window;
global.Event = dom.window.Event;

var webhookCaptured = false;

global.chrome = {
    runtime: {
        sendMessage: (msg, cb) => {
            console.log("[Chrome Stub] Received Message:", msg.action);
            if (msg.action === "fetch_profile_context") {
                if(cb) cb({ status: "success", profile: { firstName: "Agentic", lastName: "AI", email: "test@test.com", phone: "123", linkedin: "url" } });
            }
            if (msg.action === "submit_application_webhook") {
                console.log("[Chrome Stub] SUCCESS! Webhook callback triggered for ATS ID:", msg.providerJobId);
                webhookCaptured = true;
            }
        },
        onMessage: {
            addListener: (cb) => {
                global.mockUserClick = () => {
                    cb({action: "trigger_autofill_injection"}, {}, (res) => {
                        console.log("[Popup Stub] Received Injection Confirmation:", res);
                    });
                };
            }
        }
    }
};

try {
    const code = fs.readFileSync('./content.js', 'utf8');
    eval(code);

    // 1. Simulate the User clicking "Autofill Web Form" in the Popup
    console.log("--- Test 1: DOM Autofill ---");
    global.mockUserClick();

    // Verification
    const nameVal = document.querySelector('input[name="first_name"]').value;
    if (nameVal !== "Agentic") {
        throw new Error("Validation Failed: The DOM did not autofill correctly.");
    }
    console.log("PASS: The DOM was securely autofilled.");

    // 2. Simulate the user clicking "Submit" on the ATS Application
    console.log("--- Test 2: Webhook Trigger ---");
    const form = document.querySelector('form#application_form');
    form.dispatchEvent(new dom.window.Event('submit'));

    if (!webhookCaptured) {
        throw new Error("Validation Failed: The Submit Webhook was not captured by the listener.");
    }
    console.log("PASS: Webhook logic executes perfectly.");
    
    console.log("============= ALL EXPERT EXTENSION PIPELINES VALID =============");
} catch (e) {
    console.error("Test Automation Failed:", e);
    process.exit(1);
}
