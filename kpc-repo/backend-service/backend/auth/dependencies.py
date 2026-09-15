"""
FastAPI dependencies that enforce authentication and role-based access control,
matching the RBAC matrix in the platform specification:

| Capability                    | Ops | Billing Approver | Finance | Auditor | Admin |
|--------------------------------|:---:|:---:|:---:|:---:|:---:|
| Approve Invoice Batches        | ❌ | ✅ | ✅ | ❌ | ✅ |
| Issue & Push to SAP ERP        | ❌ | ❌ | ✅ | ❌ | ✅ |
| Adjudicate Carrier Disputes    | ❌ | ✅ | ✅ | ❌ | ✅ |
| Trigger ETL Pipeline Sync      | ✅ | ❌ | ❌ | ❌ | ✅ |
| Modify Commercial Tariffs      | ❌ | ❌ | ❌ | ❌ | ✅ |
"""
from typing import Dict, Any, List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from backend.auth.security import decode_access_token
from backend.auth.repository import UserRepository

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> Dict[str, Any]:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    user = UserRepository.get_by_id(payload["sub"])
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account no longer active")

    return user


def require_roles(*allowed_roles: str):
    """Dependency factory: raises 403 if the current user's role isn't in allowed_roles."""

    def _check(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires one of the following roles: {', '.join(allowed_roles)}",
            )
        return user

    return _check


# Named policies matching the RBAC matrix, for readable use in route decorators
require_billing_approval = require_roles("Billing Approver", "Finance", "Admin")
require_erp_push = require_roles("Finance", "Admin")
require_dispute_adjudication = require_roles("Billing Approver", "Finance", "Admin")
require_etl_trigger = require_roles("Ops", "Admin")
require_tariff_edit = require_roles("Admin")
