import secrets
from fastapi import APIRouter, Depends, HTTPException
from app.database import get_supabase
from app.middleware import get_user_id
from app.schemas.finance import PaymentCreate, PaymentResponse, FeeBalanceResponse

router = APIRouter()


@router.get("/balance", response_model=FeeBalanceResponse)
async def get_balance(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = sb.table("fee_balances").select("*").eq("student_id", uid).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="No fee record found")
    return res.data


@router.get("/payments", response_model=list[PaymentResponse])
async def get_payments(uid: str = Depends(get_user_id)):
    sb = get_supabase()
    res = (
        sb.table("payments")
        .select("*")
        .eq("student_id", uid)
        .order("paid_at", desc=True)
        .execute()
    )
    return res.data


@router.post("/pay", response_model=PaymentResponse)
async def make_payment(payload: PaymentCreate, uid: str = Depends(get_user_id)):
    sb = get_supabase()

    # Validate balance
    bal_res = sb.table("fee_balances").select("*").eq("student_id", uid).single().execute()
    if not bal_res.data:
        raise HTTPException(status_code=404, detail="No fee balance record found")
    balance = bal_res.data

    if payload.amount > balance["balance"]:
        raise HTTPException(status_code=400, detail="Payment exceeds outstanding balance")

    ref = f"PAY-{secrets.token_hex(6).upper()}"

    # Insert payment
    pay_res = sb.table("payments").insert({
        "student_id": uid,
        "amount": payload.amount,
        "payment_method": payload.payment_method,
        "reference": ref,
        "status": "completed",
        "description": payload.description,
    }).execute()

    # Update balance
    new_paid = balance["amount_paid"] + payload.amount
    new_balance = max(0.0, balance["balance"] - payload.amount)
    sb.table("fee_balances").update({
        "amount_paid": new_paid,
        "balance": new_balance,
        "updated_at": "now()",
    }).eq("student_id", uid).execute()

    return pay_res.data[0]
