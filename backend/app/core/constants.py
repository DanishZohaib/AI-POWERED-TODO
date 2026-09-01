"""
Backend constants for task statuses, priorities, and colors.
"""

TASK_STATUS_CONFIG = {
    "NEW": {"label": "New", "color": "blue"},
    "IN_PROGRESS": {"label": "In Progress", "color": "purple"},
    "PENDING": {"label": "Pending", "color": "amber"},
    "COMPLETED": {"label": "Completed", "color": "emerald"},
    "OVERDUE": {"label": "Overdue", "color": "red"},
    "CANCELLED": {"label": "Cancelled", "color": "slate"},
}

TASK_PRIORITY_CONFIG = {
    "CRITICAL": {"label": "Critical", "color": "red"},
    "HIGH": {"label": "High", "color": "orange"},
    "MEDIUM": {"label": "Medium", "color": "yellow"},
    "LOW": {"label": "Low", "color": "slate"},
}
