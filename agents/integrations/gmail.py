import base64
import re
import logging
from typing import Tuple
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

# Strict Regex constraints determining application state transitions natively
INTERVIEW_REGEX = re.compile(r'(?i)\b(interview|chat|next steps|availability|schedule|phone screen)\b')
REJECTION_REGEX = re.compile(r'(?i)\b(unfortunately|other candidates|not moving forward|decided to proceed|not a fit)\b')

class GmailIntegration:
    def __init__(self, token_path: str = "token.json"):
        # Relies on OAuth2 token securely generated natively by the Google Consent Screen offline
        self.scopes = ['https://www.googleapis.com/auth/gmail.readonly']
        try:
            creds = Credentials.from_authorized_user_file(token_path, self.scopes)
            self.service = build('gmail', 'v1', credentials=creds)
        except Exception as e:
            logger.warning(f"Gmail OAuth2 Engine degraded. Construct valid token.json: {e}")
            self.service = None

    def search_for_company(self, company_name: str, days_back: int = 14) -> Tuple[bool, str]:
        """Search the encrypted user inbox dynamically binding to specific ATS outbound email addresses."""
        if not self.service:
            return False, "UNKNOWN"
            
        try:
            # Query domain specific variables leveraging Google's extremely efficient full-text search parameters
            query = f'from:(*@{company_name.lower().replace(" ", "")}*) newer_than:{days_back}d'
            results = self.service.users().messages().list(userId='me', q=query, maxResults=5).execute()
            messages = results.get('messages', [])

            if not messages:
                return False, "GHOSTED"

            # Parse newest explicit response object safely
            msg_id = messages[0]['id']
            msg = self.service.users().messages().get(userId='me', id=msg_id, format='full').execute()
            
            payload = msg.get('payload', {})
            parts = payload.get('parts', [])
            body = ""
            if parts:
                for part in parts:
                    if part.get('mimeType') == 'text/plain':
                        data = part.get('body', {}).get('data', '')
                        if data:
                            body = base64.urlsafe_b64decode(data).decode('utf-8')
                        break
            
            # Classification bounds
            if REJECTION_REGEX.search(body):
                return True, "REJECTED"
            elif INTERVIEW_REGEX.search(body):
                return True, "INTERVIEWING"
                
            return True, "APPLIED" # Found interactions but ambiguous language detected natively
            
        except Exception as e:
            logger.error(f"Gmail REST API parsing failed against strict structural bounds: {e}")
            return False, "ERROR"
