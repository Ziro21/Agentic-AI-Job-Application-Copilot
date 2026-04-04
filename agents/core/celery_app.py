from celery import Celery
import os

# The Copilot Celery Core Engine physically isolates LLM generations and Selenium DOM parsing continuously
celery_app = Celery(
    "copilot_tasks",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_retries=3,
    broker_connection_retry_on_startup=True
)
