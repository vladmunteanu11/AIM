"""
Simple form submissions API endpoints for admin dashboard
"""
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc

from ...core.database import get_async_session
from ...models.admin import AdminUser
from ...models.forms import FormType, FormSubmission, ComplaintCategory, Complaint
from ..endpoints.auth import get_current_user

router = APIRouter()

@router.get("/form-submissions")
async def get_form_submissions(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of submissions to return"),
    skip: int = Query(0, ge=0, description="Number of submissions to skip"),
    status: Optional[str] = Query(None, description="Filter by status"),
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get form submissions for admin dashboard"""
    
    query = select(FormSubmission).join(FormType, FormSubmission.form_type_id == FormType.id)
    
    # Apply status filter
    if status:
        query = query.where(FormSubmission.status == status)
    
    # Order by submitted date (newest first) and apply pagination
    query = query.order_by(desc(FormSubmission.submitted_at)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    submissions = result.scalars().all()
    
    # Convert to dict format expected by frontend
    submission_list = []
    for submission in submissions:
        submission_list.append({
            "id": str(submission.id),
            "form_type_id": submission.form_type_id,
            "reference_number": submission.reference_number,
            "citizen_name": submission.citizen_name,
            "citizen_email": submission.citizen_email,
            "status": submission.status,
            "submitted_at": submission.submitted_at.isoformat(),
            "consent_given": submission.consent_given,
            "submission_data": submission.submission_data
        })
    
    return submission_list


@router.get("/form-submissions/stats")
async def get_form_submission_stats(
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Get form submission statistics for admin dashboard"""
    
    # Get total submissions count
    total_result = await db.execute(select(func.count(FormSubmission.id)))
    total_submissions = total_result.scalar() or 0
    
    # Get status breakdown
    status_result = await db.execute(
        select(FormSubmission.status, func.count(FormSubmission.id))
        .group_by(FormSubmission.status)
    )
    status_data = status_result.fetchall()
    status_breakdown = {status: count for status, count in status_data}
    
    # Get submissions from this week
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    week_result = await db.execute(
        select(func.count(FormSubmission.id))
        .where(FormSubmission.submitted_at >= week_ago)
    )
    submitted_this_week = week_result.scalar() or 0
    
    # Get form type breakdown
    type_result = await db.execute(
        select(FormType.name, func.count(FormSubmission.id))
        .join(FormSubmission, FormType.id == FormSubmission.form_type_id)
        .group_by(FormType.name)
    )
    type_data = type_result.fetchall()
    form_type_breakdown = {name: count for name, count in type_data}
    
    return {
        "total_submissions": total_submissions,
        "pending_review": status_breakdown.get("pending", 0),
        "in_review": status_breakdown.get("in_review", 0),
        "approved": status_breakdown.get("approved", 0),  
        "completed": status_breakdown.get("completed", 0),
        "rejected": status_breakdown.get("rejected", 0),
        "submitted_this_week": submitted_this_week,
        "submitted_today": 0,  # TODO: implement if needed
        "status_breakdown": status_breakdown,
        "form_type_breakdown": form_type_breakdown
    }


@router.get("/form-submissions/reference/{reference_number}")
async def get_submission_by_reference(
    reference_number: str,
    db: AsyncSession = Depends(get_async_session)
):
    """Get form submission by reference number"""
    
    result = await db.execute(
        select(FormSubmission)
        .where(FormSubmission.reference_number == reference_number)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    return {
        "id": str(submission.id),
        "form_type_id": submission.form_type_id,
        "reference_number": submission.reference_number,
        "citizen_name": submission.citizen_name,
        "citizen_email": submission.citizen_email,
        "status": submission.status,
        "submitted_at": submission.submitted_at.isoformat(),
        "consent_given": submission.consent_given,
        "submission_data": submission.submission_data
    }


@router.post("/form-submissions/{submission_id}/quick-approve")
async def quick_approve_submission(
    submission_id: str,
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Quick approve a form submission"""
    
    # Find submission
    result = await db.execute(
        select(FormSubmission).where(FormSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    if submission.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending submissions can be quick approved"
        )
    
    # Update status
    submission.status = "approved"
    submission.processed_at = datetime.now(timezone.utc)
    submission.assigned_to = current_user.id
    
    await db.commit()
    
    return {
        "message": "Submission approved successfully",
        "reference_number": submission.reference_number
    }


@router.patch("/form-submissions/{submission_id}/status")
async def update_submission_status(
    submission_id: str,
    status_data: Dict[str, str],
    current_user: AdminUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    """Update submission status"""
    
    # Find submission
    result = await db.execute(
        select(FormSubmission).where(FormSubmission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Update status
    new_status = status_data.get("status")
    if new_status:
        submission.status = new_status
        submission.processed_at = datetime.now(timezone.utc)
        submission.assigned_to = current_user.id
        
        if "notes" in status_data:
            submission.processing_notes = status_data["notes"]
    
    await db.commit()
    
    return {"message": "Status updated successfully"}