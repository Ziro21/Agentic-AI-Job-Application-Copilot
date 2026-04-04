import datetime
import logging
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

class CalendarIntegration:
    def __init__(self, token_path: str = "token.json"):
        self.scopes = ['https://www.googleapis.com/auth/calendar.events']
        try:
            creds = Credentials.from_authorized_user_file(token_path, self.scopes)
            self.service = build('calendar', 'v3', credentials=creds)
        except Exception as e:
            logger.warning(f"Google Calendar OAuth2 validation rejected. Require token.json mapping: {e}")
            self.service = None

    def schedule_follow_up(self, company_name: str, job_title: str, delay_days: int = 7):
        """Implicitly schedules an emergency 15-minute Calendar block dynamically handling specific ATS ghosting behavior."""
        if not self.service:
            return
            
        target_date = datetime.datetime.utcnow() + datetime.timedelta(days=delay_days)
        start_time = target_date.isoformat() + 'Z'
        end_time = (target_date + datetime.timedelta(minutes=15)).isoformat() + 'Z'

        event = {
            'summary': f'ATS 7-Day Follow Up: {company_name} - {job_title}',
            'description': f'Automatically scaffolded by the Copilot Job Scraper. Extended silence from {company_name} reached {delay_days} day ghost threshold.',
            'start': {'dateTime': start_time, 'timeZone': 'UTC'},
            'end': {'dateTime': end_time, 'timeZone': 'UTC'},
            'reminders': {'useDefault': True},
        }

        try:
            event_result = self.service.events().insert(calendarId='primary', body=event).execute()
            logger.info(f"Successfully mapped Google Calendar Native Block against {company_name}: {event_result.get('htmlLink')}")
        except Exception as e:
            logger.error(f"Google Calendar Block Insertion Failed natively: {e}")
