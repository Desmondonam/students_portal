from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional, Literal


class PaymentCreate(BaseModel):
    amount: float
    payment_method: Literal["card", "bank_transfer", "mobile_money"]
    description: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return v


class PaymentResponse(BaseModel):
    id: str
    student_id: str
    amount: float
    payment_method: Optional[str]
    reference: str
    status: str
    description: Optional[str]
    paid_at: datetime

    class Config:
        from_attributes = True


class FeeBalanceResponse(BaseModel):
    id: str
    student_id: str
    total_fees: float
    amount_paid: float
    balance: float
    due_date: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True
