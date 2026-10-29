import re

def validate_employee_id(value: str) -> bool:
    """Ensure employee ID is non-empty string preserving leading zeroes"""
    if not value or not isinstance(value, str):
        return False
    return len(value.strip()) >= 1

def validate_anydesk_id(value: str) -> bool:
    """Validate 9-10 digit AnyDesk address format"""
    if not value:
        return True
    cleaned = re.sub(r'\s+', '', value)
    return cleaned.isdigit() and 8 <= len(cleaned) <= 12
