from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
import models, schemas
from core.security import get_current_user
from routers.projects import require_project_access

router = APIRouter()

# ── Static routes MUST be before /{task_id} ───────────

@router.get("/my", response_model=List[schemas.TaskOut])
def my_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Task).filter(models.Task.assignee_id == current_user.id).order_by(models.Task.due_date).all()

@router.get("/overdue", response_model=List[schemas.TaskOut])
def overdue_tasks(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    memberships = db.query(models.ProjectMember).filter(models.ProjectMember.user_id == current_user.id).all()
    allowed_project_ids = [m.project_id for m in memberships]
    now = datetime.utcnow()
    return db.query(models.Task).filter(
        models.Task.project_id.in_(allowed_project_ids),
        models.Task.due_date < now,
        models.Task.status != models.TaskStatusEnum.done
    ).all()

@router.get("/dashboard", response_model=schemas.DashboardStats)
def global_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    memberships = db.query(models.ProjectMember).filter(models.ProjectMember.user_id == current_user.id).all()
    allowed_project_ids = [m.project_id for m in memberships]
    tasks = db.query(models.Task).filter(models.Task.project_id.in_(allowed_project_ids)).all()
    now = datetime.utcnow()
    return {
        "total_tasks": len(tasks),
        "todo": sum(1 for t in tasks if t.status == models.TaskStatusEnum.todo),
        "in_progress": sum(1 for t in tasks if t.status == models.TaskStatusEnum.in_progress),
        "done": sum(1 for t in tasks if t.status == models.TaskStatusEnum.done),
        "overdue": sum(1 for t in tasks if t.due_date and t.due_date.replace(tzinfo=None) < now and t.status != models.TaskStatusEnum.done),
        "total_projects": len(allowed_project_ids),
    }

# ── CRUD ──────────────────────────────────────────────

@router.post("/", response_model=schemas.TaskOut, status_code=201)
def create_task(data: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_project_access(data.project_id, db, current_user)
    task = models.Task(**data.model_dump(), creator_id=current_user.id)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/", response_model=List[schemas.TaskOut])
def list_tasks(
    project_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    assignee_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    memberships = db.query(models.ProjectMember).filter(models.ProjectMember.user_id == current_user.id).all()
    allowed_project_ids = [m.project_id for m in memberships]

    q = db.query(models.Task).filter(models.Task.project_id.in_(allowed_project_ids))
    if project_id:
        if project_id not in allowed_project_ids:
            raise HTTPException(status_code=403, detail="Not a member of this project")
        q = q.filter(models.Task.project_id == project_id)
    if status:
        q = q.filter(models.Task.status == status)
    if assignee_id:
        q = q.filter(models.Task.assignee_id == assignee_id)
    return q.order_by(models.Task.created_at.desc()).all()

@router.get("/{task_id}", response_model=schemas.TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    require_project_access(task.project_id, db, current_user)
    return task

@router.put("/{task_id}", response_model=schemas.TaskOut)
def update_task(task_id: int, data: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _, role = require_project_access(task.project_id, db, current_user)
    if role == models.RoleEnum.member and task.assignee_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update tasks assigned to you")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _, role = require_project_access(task.project_id, db, current_user)
    if role != models.RoleEnum.admin and task.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    db.delete(task)
    db.commit()
