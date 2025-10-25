import hashlib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from mangum import Mangum

app = FastAPI(title="User CRUD API - In-Memory")

# In-memory storage (resets on every Lambda cold start, but works for demo/testing)
users_db = {}
user_id_counter = {"current": 0}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int

@app.post("/users", response_model=UserOut)
def create_user(user: UserCreate):
    # Check if email already exists
    for uid, udata in users_db.items():
        if udata["email"] == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id_counter["current"] += 1
    user_id = user_id_counter["current"]
    users_db[user_id] = {
        "id": user_id,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "hashed_password": hash_password(user.password)
    }
    return UserOut(**{k: v for k, v in users_db[user_id].items() if k != "hashed_password"})

@app.get("/users", response_model=List[UserOut])
def list_users():
    return [
        UserOut(
            id=u["id"],
            email=u["email"],
            first_name=u["first_name"],
            last_name=u["last_name"]
        )
        for u in users_db.values()
    ]

@app.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    u = users_db[user_id]
    return UserOut(id=u["id"], email=u["email"], first_name=u["first_name"], last_name=u["last_name"])

@app.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, updates: UserUpdate):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    
    user = users_db[user_id]
    if updates.first_name:
        user["first_name"] = updates.first_name
    if updates.last_name:
        user["last_name"] = updates.last_name
    if updates.password:
        user["hashed_password"] = hash_password(updates.password)
    
    return UserOut(id=user["id"], email=user["email"], first_name=user["first_name"], last_name=user["last_name"])

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
    del users_db[user_id]
    return {"detail": "User deleted successfully"}

handler = Mangum(app)
