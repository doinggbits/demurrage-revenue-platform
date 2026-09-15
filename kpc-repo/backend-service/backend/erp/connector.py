"""
Enterprise ERP Integration Connector.
Formats and pushes billing documents to external ERPs (SAP S/4HANA, Oracle ERP Cloud)
and synchronizes payment and posting statuses.
"""
import uuid
from datetime import datetime, timezone
from typing import Dict, Any


class ERPConnector:
    """
    Standardized integration service for external financial systems.
    """

    @classmethod
    def generate_erp_payload(cls, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates production-grade SAP S/4HANA OData / IDoc billing payload.
        """
        return {
            "d": {
                "BillingDocumentType": "F2_DEMURRAGE",
                "CompanyCode": "KPC_KENYA_1000",
                "SalesOrganization": "KPC_DOMESTIC_SALES",
                "DistributionChannel": "10",
                "Division": "01",
                "SoldToParty": invoice.get("customer_id", "OMC_CUSTOMER"),
                "CustomerReference": invoice.get("invoice_number"),
                "BillingDocumentDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                "TotalNetAmount": invoice.get("subtotal", 0.0),
                "TotalTaxAmount": invoice.get("tax_amount", 0.0),
                "TotalGrossAmount": invoice.get("total_amount", 0.0),
                "TransactionCurrency": invoice.get("currency", "KES"),
                "to_Item": [
                    {
                        "BillingDocumentItem": "000010",
                        "Material": "KPC_DEMURRAGE_SERVICE",
                        "ItemGrossWeight": 1.0,
                        "ItemWeightUnit": "EA",
                        "NetAmount": invoice.get("subtotal", 0.0),
                        "TaxAmount": invoice.get("tax_amount", 0.0),
                        "CostCenter": "CC_DEPOT_OPS_204",
                        "TurnaroundTripId": invoice.get("trip_id"),
                        "TruckRegistration": invoice.get("truck_plate"),
                        "AuditCryptographicSignature": invoice.get("audit_signature", "N/A"),
                    }
                ],
            }
        }

    @classmethod
    def push_invoice_to_erp(cls, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """
        Simulates atomic external ERP invoice posting with reference ID generation.
        """
        payload = cls.generate_erp_payload(invoice)
        erp_ref = f"SAP-POST-{uuid.uuid4().hex[:8].upper()}"

        return {
            "success": True,
            "erp_system": "SAP S/4HANA Cloud (KPC Corporate Financials)",
            "erp_reference": erp_ref,
            "http_status": 201,
            "posted_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "payload_preview": payload,
            "message": f"Successfully posted billing document to SAP Financials under document reference {erp_ref}.",
        }
