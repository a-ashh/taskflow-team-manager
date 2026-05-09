from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from core.security import get_current_user

router = APIRouter()

def get_member_role(project: models.Project, user_id: int):
    """Returns the role of the user in the project, or None if not a member."""
    if project.owner_id == user_id:
        return models.RoleEnum.admin
    for m in project.members:
        if m.user_id == user_id:
            return m.role
    return None

def require_project_access(project_id: int, db: Session, current_user: models.User):
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    role = get_member_role(project, current_user.id)
    if role is None:
        raise HTTPException(status_code=403, detail="Not a member of this project")
    return project, role

def require_admin(project_id: int, db: Session, current_user: models.User):
    project, role = require_project_access(project_id, db, current_user)
    if role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return project

# ── CRUD ──────────────────────────────────────────────
@router.post("/", response_model=schemas.ProjectOut, status_code=201)
def create_project(data: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = models.Project(**data.model_dump(), owner_id=current_user.id)
    db.add(project)
    db.flush()
    # Auto-add creator as admin member
    membership = models.ProjectMember(project_id=project.id, user_id=current_user.id, role=models.RoleEnum.admin)
    db.add(membership)
    db.commit()
    db.refresh(project)
    return project

@router.get("/", response_model=List[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    memberships = db.query(models.ProjectMember).filter(models.ProjectMember.user_id == current_user.id).all()
    project_ids = [m.project_id for m in memberships]
    return db.query(models.Project).filter(models.Project.id.in_(project_ids)).all()

@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project, _ = require_project_access(project_id, db, current_user)
    return project

@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, data: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = require_admin(project_id, db, current_user)
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = require_admin(project_id, db, current_user)
    db.delete(project)
    db.commit()

# ── Members ───────────────────────────────────────────
@router.post("/{project_id}/members", response_model=schemas.MemberOut, status_code=201)
def add_member(project_id: int, body: schemas.AddMemberRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_admin(project_id, db, current_user)
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found with that email")
    existing = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")
    member = models.ProjectMember(project_id=project_id, user_id=user.id, role=body.role)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member

@router.put("/{project_id}/members/{user_id}", response_model=schemas.MemberOut)
def update_member_role(project_id: int, user_id: int, body: schemas.UpdateRoleRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_admin(project_id, db, current_user)
    member = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    member.role = body.role
    db.commit()
    db.refresh(member)
    return member

@router.delete("/{project_id}/members/{user_id}", status_code=204)
def remove_member(project_id: int, user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    require_admin(project_id, db, current_user)
    member = db.query(models.ProjectMember).filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()

# ── Dashboard ─────────────────────────────────────────
@router.get("/{project_id}/dashboard", response_model=schemas.DashboardStats)
def project_dashboard(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from datetime import datetime
    require_project_access(project_id, db, current_user)
    tasks = db.query(models.Task).filter(models.Task.project_id == project_id).all()
    now = datetime.utcnow()
    return {
        "total_tasks": len(tasks),
        "todo": sum(1 for t in tasks if t.status == models.TaskStatusEnum.todo),
        "in_progress": sum(1 for t in tasks if t.status == models.TaskStatusEnum.in_progress),
        "done": sum(1 for t in tasks if t.status == models.TaskStatusEnum.done),
        "overdue": sum(1 for t in tasks if t.due_date and t.due_date.replace(tzinfo=None) < now and t.status != models.TaskStatusEnum.done),
        "total_projects": 1,
    }
