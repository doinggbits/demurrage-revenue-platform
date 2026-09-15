"""
Automated Contract Compliance & Audit Readiness Engine.
Validates operational evidence against commercial contractual terms before invoicing.
"""
from typing import List, Dict, Any
from pydantic import BaseModel


class RuleCheckResult(BaseModel):
    rule_id: str
    rule_name: str
    category: str
    status: str  # PASS, WARNING, FAIL
    weight: int
    earned_score: int
    details: str
    evidence_ref: str


class ComplianceResult(BaseModel):
    movement_id: str
    contract_code: str
    compliance_score: int  # 0 to 100
    status: str  # PASSED, REVIEW_REQUIRED, REJECTED
    can_auto_invoice: bool
    summary: str
    rules: List[RuleCheckResult]


class ComplianceEngine:
    """
    Evaluates truck movement evidence against contract compliance standards.
    """

    @classmethod
    def evaluate_movement(
        cls,
        movement: Dict[str, Any],
        contract: Dict[str, Any],
        has_active_dispute: bool = False,
        depot_has_incident: bool = False,
    ) -> ComplianceResult:
        rules: List[RuleCheckResult] = []

        # 1. Valid Contract Rule (Weight: 25)
        contract_status = contract.get("status", "ACTIVE")
        is_deleted = contract.get("is_deleted", 0)
        if contract_status == "ACTIVE" and not is_deleted:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_01_CONTRACT",
                    rule_name="Active Commercial Contract",
                    category="Contractual",
                    status="PASS",
                    weight=25,
                    earned_score=25,
                    details=f"Matched to valid contract {contract.get('code', 'N/A')} (v{contract.get('version', '1.0')})",
                    evidence_ref=f"CTR-DOC-{contract.get('code', 'REF')}",
                )
            )
        else:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_01_CONTRACT",
                    rule_name="Active Commercial Contract",
                    category="Contractual",
                    status="FAIL",
                    weight=25,
                    earned_score=0,
                    details=f"Contract {contract.get('code')} status is {contract_status} or archived",
                    evidence_ref="CTR-EXPIRED",
                )
            )

        # 2. Geofence Telemetry Verification (Weight: 20)
        geofence_verified = bool(movement.get("geofence_verified", False))
        if geofence_verified:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_02_GEOFENCE",
                    rule_name="GIS Geofence Verification",
                    category="Operational",
                    status="PASS",
                    weight=20,
                    earned_score=20,
                    details="GPS coordinates match depot ingress and egress geofence boundaries.",
                    evidence_ref=f"GPS-LOG-{movement.get('trip_id', 'TRIP')}-IN_OUT",
                )
            )
        else:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_02_GEOFENCE",
                    rule_name="GIS Geofence Verification",
                    category="Operational",
                    status="WARNING",
                    weight=20,
                    earned_score=10,
                    details="GPS telemetry discrepancy detected; manual gate timestamp fallback used.",
                    evidence_ref="MANUAL-GATE-OVERRIDE",
                )
            )

        # 3. Dual Weight Bridge Tickets (Weight: 15)
        weight_ticket_verified = bool(movement.get("weight_ticket_verified", False))
        if weight_ticket_verified:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_03_WEIGHT",
                    rule_name="Weighbridge Tickets Validation",
                    category="Operational",
                    status="PASS",
                    weight=15,
                    earned_score=15,
                    details="Gross and tare weighbridge certificates verified by depot scale.",
                    evidence_ref=f"WB-{movement.get('trip_id', 'TRIP')}-CERT",
                )
            )
        else:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_03_WEIGHT",
                    rule_name="Weighbridge Tickets Validation",
                    category="Operational",
                    status="WARNING",
                    weight=15,
                    earned_score=5,
                    details="Tare weight ticket missing or pending operator validation.",
                    evidence_ref="WB-PENDING",
                )
            )

        # 4. Gate Pass Authorization (Weight: 15)
        gate_pass_verified = bool(movement.get("gate_pass_verified", False))
        if gate_pass_verified:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_04_GATE_PASS",
                    rule_name="Signed Electronic Gate Pass",
                    category="Security",
                    status="PASS",
                    weight=15,
                    earned_score=15,
                    details="Driver security pass badge scanned and authenticated at gate terminal.",
                    evidence_ref=f"GP-{movement.get('truck_plate', 'TRK')}-PASS",
                )
            )
        else:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_04_GATE_PASS",
                    rule_name="Signed Electronic Gate Pass",
                    category="Security",
                    status="FAIL",
                    weight=15,
                    earned_score=0,
                    details="Gate pass signature missing or unverified driver credential.",
                    evidence_ref="GP-MISSING",
                )
            )

        # 5. Open Dispute Lock (Weight: 15)
        if not has_active_dispute:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_05_DISPUTE",
                    rule_name="Dispute Clearance Status",
                    category="Billing",
                    status="PASS",
                    weight=15,
                    earned_score=15,
                    details="Zero open carrier disputes or pending arbitration on this movement.",
                    evidence_ref="DISPUTE-CLEARED",
                )
            )
        else:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_05_DISPUTE",
                    rule_name="Dispute Clearance Status",
                    category="Billing",
                    status="FAIL",
                    weight=15,
                    earned_score=0,
                    details="Active dispute claim is blocking automatic invoice generation.",
                    evidence_ref="DISPUTE-ACTIVE-HOLD",
                )
            )

        # 6. Terminal Operational Condition (Weight: 10)
        delay_reason = movement.get("delay_reason") or ""
        is_force_majeure = "force majeure" in delay_reason.lower() or "weather" in delay_reason.lower() or depot_has_incident
        if not is_force_majeure:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_06_EXEMPTION",
                    rule_name="Force Majeure & Facility Exemption",
                    category="Contractual",
                    status="PASS",
                    weight=10,
                    earned_score=10,
                    details="No qualifying terminal breakdown or severe weather condition recorded.",
                    evidence_ref="NO-INCIDENT-LOG",
                )
            )
        else:
            rules.append(
                RuleCheckResult(
                    rule_id="RULE_06_EXEMPTION",
                    rule_name="Force Majeure & Facility Exemption",
                    category="Contractual",
                    status="WARNING",
                    weight=10,
                    earned_score=0,
                    details=f"Delay cause indicates possible facility liability ({delay_reason}). Requires review.",
                    evidence_ref="INCIDENT-EXEMPT-ALERT",
                )
            )

        # Aggregate Score
        total_score = sum(r.earned_score for r in rules)
        
        # Hard fail check
        has_hard_fail = any(r.status == "FAIL" for r in rules)

        if total_score >= 85 and not has_hard_fail:
            status = "PASSED"
            can_auto_invoice = True
            summary = "Fully compliant with contractual and evidentiary standards. Safe to invoice."
        elif total_score >= 60:
            status = "REVIEW_REQUIRED"
            can_auto_invoice = False
            summary = "Compliance score requires Billing Approver sign-off prior to invoice issuance."
        else:
            status = "REJECTED"
            can_auto_invoice = False
            summary = "Critical compliance failures detected. Invoicing blocked until resolved."

        return ComplianceResult(
            movement_id=str(movement.get("id", "")),
            contract_code=contract.get("code", "UNKNOWN"),
            compliance_score=total_score,
            status=status,
            can_auto_invoice=can_auto_invoice,
            summary=summary,
            rules=rules,
        )
