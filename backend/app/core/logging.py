import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.core.correlation import get_correlation_id

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

LOG_FILE = LOG_DIR / "backend.log"


class CorrelationFilter(logging.Filter):
    def filter(self, record):
        record.correlation_id = get_correlation_id()
        return True


formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(correlation_id)s | %(name)s | %(message)s"
)

file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8",
)

file_handler.addFilter(CorrelationFilter())
file_handler.setFormatter(formatter)

console_handler = logging.StreamHandler()
console_handler.addFilter(CorrelationFilter())
console_handler.setFormatter(formatter)

logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler],
    force=True,
)

logger = logging.getLogger("football-analysis")
