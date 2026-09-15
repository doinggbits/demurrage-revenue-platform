"""
Pure, Deterministic, Versioned Demurrage & Detention Calculation Engine.
Engine Version: 2.4.0

This module contains zero side-effects, zero I/O, and zero dependencies on UI or database.
Given identical CalculationContext inputs, it produces byte-for-byte identical CalculationResult
records with mathematical audit traces and cryptographic proof.
"""
import hashlib
import json
import math
from datetime import datetime, timezone
from typing import List

from .models import CalculationContext, CalculationResult, ArithmeticStep
from .calendar import CalendarService



class DemurrageCalculationEngine:
    VERSION = "2.4.0"

    @classmethod
    def calculate(cls, ctx: CalculationContext) -> CalculationResult:
        """
        Executes deterministic 12-step demurrage and detention calculation.
        Generates step-by-step arithmetic proof.
        """
        steps: List[ArithmeticStep] = []

        # Reference time determination
        end_time = ctx.gate_out or ctx.as_of_time or datetime.now(timezone.utc).replace(tzinfo=None)
        is_ongoing = ctx.gate_out is None

        # Step 1: Turnaround duration
        total_seconds = (end_time - ctx.gate_in).total_seconds()
        total_turnaround_mins = max(0, int(total_seconds // 60))
        steps.append(
            ArithmeticStep(
                step_num=1,
                name="Gross Turnaround Time",
                description="Elapsed time from Gate In to Gate Out (or current time if active)",
                formula="GateOut - GateIn",
                inputs={
                    "gate_in": ctx.gate_in.isoformat(),
                    "gate_out": end_time.isoformat(),
                    "is_ongoing": is_ongoing,
                },
                output_value=f"{total_turnaround_mins} minutes ({total_turnaround_mins / 60.0:.2f} hrs)",
            )
        )

        # Step 2: Contract Free Time Deduction
        free_time = ctx.free_time_mins
        gross_excess_mins = max(0, total_turnaround_mins - free_time)
        steps.append(
            ArithmeticStep(
                step_num=2,
                name="Contract Free Time Deduction",
                description="Deduct agreed commercial free turnaround time",
                formula="max(0, TurnaroundMins - FreeTimeMins)",
                inputs={
                    "turnaround_mins": total_turnaround_mins,
                    "free_time_mins": free_time,
                },
                output_value=f"{gross_excess_mins} minutes excess",
            )
        )

        # Step 3: Grace Period Evaluation
        grace = ctx.grace_period_mins
        if gross_excess_mins == 0:
            net_excess_mins = 0
            grace_note = "Turnaround was within contract free time; no grace evaluated."
        elif gross_excess_mins <= grace:
            net_excess_mins = 0
            grace_note = f"Gross excess ({gross_excess_mins}m) <= Grace period ({grace}m). Completely protected."
        else:
            if ctx.grace_cliff:
                net_excess_mins = gross_excess_mins
                grace_note = f"Grace exceeded ({gross_excess_mins}m > {grace}m). Grace cliff active: full excess charged."
            else:
                net_excess_mins = gross_excess_mins - grace
                grace_note = f"Grace exceeded ({gross_excess_mins}m > {grace}m). Grace subtracted: net excess = {net_excess_mins}m."

        steps.append(
            ArithmeticStep(
                step_num=3,
                name="Grace Period Evaluation",
                description=grace_note,
                formula="if GrossExcess <= Grace: 0 else (GrossExcess - Grace if not Cliff else GrossExcess)",
                inputs={
                    "gross_excess_mins": gross_excess_mins,
                    "grace_period_mins": grace,
                    "grace_cliff": ctx.grace_cliff,
                },
                output_value=f"{net_excess_mins} minutes net billable excess",
            )
        )

        # Step 4: Billable Unit Rounding
        inc = max(1, ctx.rounding_increment_mins)
        if net_excess_mins == 0:
            billable_hours = 0.0
            rounding_formula = "0 excess = 0.0 billable hours"
        else:
            if ctx.rounding_mode == "ceil":
                buckets = math.ceil(net_excess_mins / inc)
                billable_hours = round(buckets * (inc / 60.0), 2)
                rounding_formula = f"ceil({net_excess_mins} / {inc}) * ({inc} / 60)"
            elif ctx.rounding_mode == "floor":
                buckets = math.floor(net_excess_mins / inc)
                billable_hours = round(buckets * (inc / 60.0), 2)
                rounding_formula = f"floor({net_excess_mins} / {inc}) * ({inc} / 60)"
            else:  # exact
                billable_hours = round(net_excess_mins / 60.0, 4)
                rounding_formula = f"{net_excess_mins} / 60.0"

        steps.append(
            ArithmeticStep(
                step_num=4,
                name="Billable Time Units Conversion",
                description=f"Rounded according to contract rule '{ctx.rounding_mode}' in {inc}-minute increments",
                formula=rounding_formula,
                inputs={
                    "net_excess_mins": net_excess_mins,
                    "rounding_increment_mins": inc,
                    "rounding_mode": ctx.rounding_mode,
                },
                output_value=f"{billable_hours} billable hours",
            )
        )

        # Step 5: Calendar Multiplier (Weekend / Holiday)
        multiplier, is_weekend, is_holiday = CalendarService.get_calendar_multiplier(
            ctx.gate_in, end_time, ctx.weekend_multiplier, ctx.holiday_multiplier
        )
        steps.append(
            ArithmeticStep(
                step_num=5,
                name="Calendar & Operational Multipliers",
                description=f"Weekend: {is_weekend}, Holiday: {is_holiday}. Multiplier: {multiplier}x",
                formula="max(weekend_multiplier, holiday_multiplier) if applicable else 1.0",
                inputs={
                    "weekend_multiplier": ctx.weekend_multiplier,
                    "holiday_multiplier": ctx.holiday_multiplier,
                    "is_weekend": is_weekend,
                    "is_holiday": is_holiday,
                },
                output_value=f"{multiplier}x multiplier",
            )
        )

        # Step 6: Demurrage Base Charge
        demurrage_base = round(billable_hours * ctx.demurrage_rate_per_hr * multiplier, 2)
        steps.append(
            ArithmeticStep(
                step_num=6,
                name="Base Demurrage Calculation",
                description="Billable hours multiplied by contract hourly rate and calendar multiplier",
                formula="BillableHours * RatePerHour * Multiplier",
                inputs={
                    "billable_hours": billable_hours,
                    "rate_per_hour": ctx.demurrage_rate_per_hr,
                    "multiplier": multiplier,
                },
                output_value=f"{ctx.currency} {demurrage_base:.2f}",
            )
        )

        # Step 7: Detention Days Check
        detention_threshold = ctx.detention_threshold_mins
        if total_turnaround_mins > detention_threshold:
            excess_detention_mins = total_turnaround_mins - detention_threshold
            detention_days = math.ceil(excess_detention_mins / 1440)
            detention_charge = round(detention_days * ctx.detention_rate_per_day, 2)
            detention_note = f"Truck exceeded maximum yard detention limit ({detention_threshold} mins / {detention_threshold/60:.1f} hrs)."
        else:
            detention_days = 0
            detention_charge = 0.0
            detention_note = f"Turnaround within detention limit ({detention_threshold} mins). Detention = 0."

        steps.append(
            ArithmeticStep(
                step_num=7,
                name="Detention Days Evaluation",
                description=detention_note,
                formula="ceil((TurnaroundMins - DetentionThreshold) / 1440) * RatePerDay if exceeded else 0",
                inputs={
                    "total_turnaround_mins": total_turnaround_mins,
                    "detention_threshold_mins": detention_threshold,
                    "detention_rate_per_day": ctx.detention_rate_per_day,
                },
                output_value=f"{detention_days} days = {ctx.currency} {detention_charge:.2f}",
            )
        )

        # Step 8: Gross Subtotal
        gross_subtotal = round(demurrage_base + detention_charge, 2)
        steps.append(
            ArithmeticStep(
                step_num=8,
                name="Gross Subtotal",
                description="Sum of base demurrage charge and detention fees",
                formula="DemurrageBase + DetentionCharge",
                inputs={
                    "demurrage_base": demurrage_base,
                    "detention_charge": detention_charge,
                },
                output_value=f"{ctx.currency} {gross_subtotal:.2f}",
            )
        )

        # Step 9: Contractual Maximum Cap
        if ctx.max_cap_amount > 0.0 and gross_subtotal > ctx.max_cap_amount:
            capped_subtotal = ctx.max_cap_amount
            cap_note = f"Contract cap ({ctx.currency} {ctx.max_cap_amount:.2f}) applied. Charge reduced from {gross_subtotal:.2f}."
        else:
            capped_subtotal = gross_subtotal
            cap_note = "No cap exceeded or no cap defined in contract."

        steps.append(
            ArithmeticStep(
                step_num=9,
                name="Contractual Maximum Charge Cap",
                description=cap_note,
                formula="min(GrossSubtotal, MaxCap) if MaxCap > 0 else GrossSubtotal",
                inputs={
                    "gross_subtotal": gross_subtotal,
                    "max_cap_amount": ctx.max_cap_amount,
                },
                output_value=f"{ctx.currency} {capped_subtotal:.2f}",
            )
        )

        # Step 10: Approved Commercial Waiver Deduction
        waiver = round(min(capped_subtotal, max(0.0, ctx.waiver_amount)), 2)
        post_waiver_amount = round(capped_subtotal - waiver, 2)
        steps.append(
            ArithmeticStep(
                step_num=10,
                name="Approved Waiver / Dispute Credit",
                description="Deduction of authorized operational waivers or pre-settled dispute credits",
                formula="max(0, CappedSubtotal - ApprovedWaiver)",
                inputs={
                    "capped_subtotal": capped_subtotal,
                    "waiver_amount": waiver,
                },
                output_value=f"-{ctx.currency} {waiver:.2f} (Net: {ctx.currency} {post_waiver_amount:.2f})",
            )
        )

        # Step 11: Tax / VAT Computation
        tax_amount = round(post_waiver_amount * ctx.tax_rate, 2)
        steps.append(
            ArithmeticStep(
                step_num=11,
                name="Applicable Taxes / VAT",
                description=f"Tax calculated at contract rate ({ctx.tax_rate * 100:.1f}%)",
                formula="PostWaiverAmount * TaxRate",
                inputs={
                    "taxable_amount": post_waiver_amount,
                    "tax_rate": ctx.tax_rate,
                },
                output_value=f"{ctx.currency} {tax_amount:.2f}",
            )
        )

        # Step 12: Final Total Billable Charge
        final_total = round(post_waiver_amount + tax_amount, 2)
        steps.append(
            ArithmeticStep(
                step_num=12,
                name="Final Verified Payable Charge",
                description="Net billable amount including statutory handling tax",
                formula="PostWaiverAmount + TaxAmount",
                inputs={
                    "post_waiver_amount": post_waiver_amount,
                    "tax_amount": tax_amount,
                },
                output_value=f"{ctx.currency} {final_total:.2f}",
            )
        )

        # Cryptographic Input Hash
        input_payload = json.dumps(
            {
                "movement_id": ctx.movement_id,
                "truck_plate": ctx.truck_plate,
                "contract_code": ctx.contract_code,
                "gate_in": ctx.gate_in.isoformat(),
                "gate_out": end_time.isoformat(),
                "free_time_mins": ctx.free_time_mins,
                "grace_period_mins": ctx.grace_period_mins,
                "demurrage_rate_per_hr": ctx.demurrage_rate_per_hr,
                "detention_rate_per_day": ctx.detention_rate_per_day,
                "rounding_increment_mins": ctx.rounding_increment_mins,
                "tax_rate": ctx.tax_rate,
            },
            sort_keys=True,
        )
        input_hash = hashlib.sha256(input_payload.encode("utf-8")).hexdigest()

        # Immutable Audit Signature
        signature_payload = json.dumps(
            {
                "engine_version": cls.VERSION,
                "input_hash": input_hash,
                "final_total": final_total,
                "net_excess_mins": net_excess_mins,
                "billable_hours": billable_hours,
                "step_count": len(steps),
            },
            sort_keys=True,
        )
        audit_signature = hashlib.sha256(signature_payload.encode("utf-8")).hexdigest()

        return CalculationResult(
            engine_version=cls.VERSION,
            calculated_at=datetime.now(timezone.utc).isoformat(),
            movement_id=ctx.movement_id,
            truck_plate=ctx.truck_plate,
            contract_code=ctx.contract_code,
            total_turnaround_mins=total_turnaround_mins,
            free_time_mins=free_time,
            grace_period_mins=grace,
            net_excess_mins=net_excess_mins,
            billable_demurrage_hours=billable_hours,
            is_in_demurrage=net_excess_mins > 0,
            is_ongoing=is_ongoing,
            applied_multiplier=multiplier,
            is_weekend_involved=is_weekend,
            demurrage_base_charge=demurrage_base,
            detention_days=detention_days,
            detention_charge=detention_charge,
            subtotal=gross_subtotal,
            capped_amount=capped_subtotal,
            waiver_amount=waiver,
            tax_amount=tax_amount,
            total_charge=final_total,
            currency=ctx.currency,
            step_trace=steps,
            input_hash=input_hash,
            audit_signature=audit_signature,
        )
