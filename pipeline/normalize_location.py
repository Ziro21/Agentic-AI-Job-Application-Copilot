from typing import Tuple

def normalize_location(location_raw: str | None) -> Tuple[str | None, bool]:
    """
    Parse a raw location string to determine country and remote status.
    Returns: (country: str | None, is_remote: bool)
    """
    if not location_raw:
        return None, False
        
    loc = location_raw.lower()
    
    # Check remote status
    is_remote = "remote" in loc or "anywhere" in loc or "telecommute" in loc
    
    # Simple country matching (expandable based on filters/config)
    country = None
    uk_keywords = ["uk", "united kingdom", "london", "cambridge", "oxford", "bristol", "edinburgh", "manchester"]
    us_keywords = ["us", "usa", "united states", "new york", "san francisco", "california", "boston"]
    canada_keywords = ["canada", "toronto", "vancouver"]
    
    if any(kw in loc for kw in uk_keywords):
        country = "UK"
    elif any(kw in loc for kw in us_keywords):
        country = "US"
    elif any(kw in loc for kw in canada_keywords):
        country = "CA"
        
    return country, is_remote
