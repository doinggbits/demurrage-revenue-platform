"""
Pydantic data models for the Demurrage Calculation Engine.
Enforces strict typing, serialization, and deterministic input validation.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ArithmeticStep(BaseModel):
    step_num: int
    name: str
    description: str
    formula: str
    inputs: Dict[str, Any]
    output_value: Any


class CalculationContext(BaseModel):
    movement_id: str
    truck_plate: str
    gate_in: datetime
    gate_out: Optional[datetime] = None
    as_of_time: Optional[datetime] = None
    
    # Commercial Contract Terms
    contract_id: str
    contract_code: str
    free_time_mins: int = Field(default=120, ge=0, description="Allowed free time in minutes")
    grace_period_mins: int = Field(default=15, ge=0, description="Grace period before penalties apply")
    grace_cliff: bool = Field(default=False, description="If true, exceeding grace incurs charges for whole excess")
    
    # Rates
    demurrage_rate_per_hr: float = Field(default=11000.0, ge=0.0, description="Hourly demurrage fee")
    detention_rate_per_day: float = Field(default=45000.0, ge=0.0, description="Daily detention fee beyond yard max limit")
    detention_threshold_mins: int = Field(default=1440, ge=60, description="Minutes after which detention applies (e.g. 24h)")
    
    # Billing rules
    rounding_increment_mins: int = Field(default=60, ge=1, description="Rounding bucket (e.g. 60=1hr, 15=15min)")
    rounding_mode: str = Field(default="ceil", description="ceil, floor, exact")
    weekend_multiplier: float = Field(default=1.0, ge=1.0, description="Multiplier for demurrage occurring on weekends")
    holiday_multiplier: float = Field(default=1.0, ge=1.0, description="Multiplier for demurrage on public holidays")
    
    # Caps & Taxes
    max_cap_amount: float = Field(default=0.0, ge=0.0, description="Maximum billable charge cap (0 = uncapped)")
    tax_rate: float = Field(default=0.05, ge=0.0, description="Applicable tax/VAT rate (e.g. 0.05 = 5%)")
    waiver_amount: float = Field(default=0.0, ge=0.0, description="Pre-approved commercial credit / waiver")
    currency: str = Field(default="KES")


class CalculationResult(BaseModel):
    engine_version: str
    calculated_at: str
    movement_id: str
    truck_plate: str
    contract_code: str
    
    # Time values
    total_turnaround_mins: int
    free_time_mins: int
    grace_period_mins: int
    net_excess_mins: int
    billable_demurrage_hours: float
    is_in_demurrage: bool
    is_ongoing: bool
    
    # Calendar & Rate adjustments
    applied_multiplier: float
    is_weekend_involved: bool
    
    # Breakdown charges
    demurrage_base_charge: float
    detention_days: int
    detention_charge: float
    subtotal: float
    capped_amount: float
    waiver_amount: float
    tax_amount: float
    total_charge: float
    currency: str
    
    # Step-by-step arithmetic trace for audit
    step_trace: List[ArithmeticStep]
    
    # Immutable Hashes
    input_hash: str
    audit_signature: str
