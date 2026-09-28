import enum

from sqlalchemy import Column, Enum, Integer, String

from .db import Base


class UserRole(str, enum.Enum):
    technician = "technician"
    general = "general"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.general)