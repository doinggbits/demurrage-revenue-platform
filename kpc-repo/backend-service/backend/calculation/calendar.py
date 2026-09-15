"""
Calendar and holiday management for demurrage calculations.
Supports weekend detection and enterprise holiday schedules.
"""
from datetime import datetime, date
from typing import Set


class CalendarService:
    # Standard recognized logistics holidays (month, day)
    STANDARD_HOLIDAYS: Set[tuple] = {
        (1, 1),   # New Year's Day
        (5, 1),   # International Labor Day
        (7, 4),   # Independence Day
        (12, 25), # Christmas Day
        (12, 26), # Boxing Day
    }

    @classmethod
    def is_weekend(cls, dt: datetime) -> bool:
        """Returns True if the datetime falls on a Saturday (5) or Sunday (6)."""
        return dt.weekday() in (5, 6)

    @classmethod
    def is_holiday(cls, dt: datetime) -> bool:
        """Returns True if the datetime falls on a predefined holiday."""
        return (dt.month, dt.day) in cls.STANDARD_HOLIDAYS

    @classmethod
    def get_calendar_multiplier(
        cls, start_dt: datetime, end_dt: datetime, weekend_mult: float, holiday_mult: float
    ) -> tuple[float, bool, bool]:
        """
        Calculates effective multiplier based on whether any portion of turnaround
        falls on a weekend or holiday. Holiday takes precedence if higher.
        """
        has_weekend = cls.is_weekend(start_dt) or cls.is_weekend(end_dt)
        has_holiday = cls.is_holiday(start_dt) or cls.is_holiday(end_dt)

        multiplier = 1.0
        if has_holiday and holiday_mult > 1.0:
            multiplier = max(multiplier, holiday_mult)
        elif has_weekend and weekend_mult > 1.0:
            multiplier = max(multiplier, weekend_mult)

        return multiplier, has_weekend, has_holiday
