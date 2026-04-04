from playwright.sync_api import sync_playwright
import logging

logger = logging.getLogger(__name__)

class HeadlessBrowserContext:
    """Manages an ephemeral Chromium lifecycle explicitly breaking JavaScript CSRF locks securely."""
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None

    def __enter__(self):
        logger.info("Booting Playwright Headless Chromium Engine...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(args=["--no-sandbox", "--disable-setuid-sandbox"], headless=True)
        self.context = self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        return self.context

    def __exit__(self, exc_type, exc_val, exc_tb):
        logger.info("Tearing down Headless Chromium bounds...")
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
