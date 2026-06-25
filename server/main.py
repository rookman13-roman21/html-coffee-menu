from fastapi import FastAPI, HTTPException, Depends, Request, status, BackgroundTasks, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt as _bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os, json, urllib.request, urllib.parse, hashlib
import threading, time
import re
import base64
import mimetypes

import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Конфигурация ──────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production-secret-key-32chars")

def _derived_webhook_secret(env_name: str, salt: str) -> str:
    explicit = os.getenv(env_name, "").strip()
    if explicit:
        return explicit
    if not SECRET_KEY or SECRET_KEY.startswith("change-me"):
        return ""
    return hashlib.sha256(f"{SECRET_KEY}:{salt}".encode("utf-8")).hexdigest()

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@barista-school.online")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
PUBLIC_UPLOAD_DIR = os.path.join(DATA_DIR, "public_uploads")
WORKSPACE_UPLOAD_DIR = os.path.join(DATA_DIR, "workspace_uploads")
ACCOUNT_AVATAR_DIR = os.path.join(PUBLIC_UPLOAD_DIR, "accounts")
AUTHOR_AVATAR_DIR = os.path.join(PUBLIC_UPLOAD_DIR, "authors")
AUTHOR_RECIPE_IMAGE_DIR = os.path.join(PUBLIC_UPLOAD_DIR, "author-recipes")
WORKSPACE_FILE_MAX_BYTES = 10 * 1024 * 1024
WORKSPACE_FILE_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/csv": "csv",
    "text/plain": "txt",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}
WORKSPACE_FILE_EXTENSIONS = {
    "pdf": ("application/pdf", "pdf"),
    "docx": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"),
    "xlsx": ("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"),
    "csv": ("text/csv", "csv"),
    "txt": ("text/plain", "txt"),
    "png": ("image/png", "png"),
    "jpg": ("image/jpeg", "jpg"),
    "jpeg": ("image/jpeg", "jpg"),
    "webp": ("image/webp", "webp"),
}
OAUTH_EXCHANGE_TTL_SECONDS = 120
_oauth_exchange_codes: dict[str, dict] = {}
TG_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TG_ADMIN_CHAT = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "")
TELEGRAM_WEBHOOK_SECRET = _derived_webhook_secret("TELEGRAM_WEBHOOK_SECRET", "telegram-webhook")
JOIN_MBS_BOT_TOKEN = os.getenv("JOIN_MBS_BOT_TOKEN", "")
JOIN_MBS_BOT_USERNAME = os.getenv("JOIN_MBS_BOT_USERNAME", "Join_MBS_bot").lstrip("@")
JOIN_MBS_AUTHOR_REVIEW_CHAT_ID = os.getenv("JOIN_MBS_AUTHOR_REVIEW_CHAT_ID", "") or TG_ADMIN_CHAT
JOIN_MBS_WEBHOOK_SECRET = os.getenv("JOIN_MBS_WEBHOOK_SECRET", "")
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
APP_URL          = os.getenv("APP_URL", "https://barista-school.online")
YANDEX_CLIENT_ID = os.getenv("YANDEX_CLIENT_ID", "")
YANDEX_SECRET    = os.getenv("YANDEX_SECRET", "")
YANDEX_REDIRECT  = os.getenv("YANDEX_REDIRECT", "https://barista-school.online/api/auth/yandex/callback")

# ── БД ────────────────────────────────────────────────────────
os.makedirs("data", exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(WORKSPACE_UPLOAD_DIR, exist_ok=True)
os.makedirs(ACCOUNT_AVATAR_DIR, exist_ok=True)
os.makedirs(AUTHOR_AVATAR_DIR, exist_ok=True)
os.makedirs(AUTHOR_RECIPE_IMAGE_DIR, exist_ok=True)
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id          = Column(Integer, primary_key=True, index=True)
    email       = Column(String, unique=True, index=True, nullable=False)
    name        = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active      = Column(Boolean, default=False)
    is_admin       = Column(Boolean, default=False)
    consent        = Column(Boolean, default=False)
    consent_at     = Column(DateTime, nullable=True)
    phone          = Column(String, nullable=True)
    reg_source     = Column(String, nullable=True)  # 'email' | 'yandex'
    created_at     = Column(DateTime, default=datetime.utcnow)
    last_login_at        = Column(DateTime, nullable=True)
    reset_token          = Column(String, nullable=True)
    reset_token_expires  = Column(DateTime, nullable=True)
    notes                = Column(String, nullable=True)
    notes_updated_at     = Column(DateTime, nullable=True)
    access_drinks        = Column(Boolean, default=False)
    access_finance       = Column(Boolean, default=False)
    access_author        = Column(Boolean, default=False)
    avatar_url           = Column(String, nullable=True)
    bitrix_contact_id    = Column(String, nullable=True)
    bitrix_sync_status   = Column(String, nullable=True)
    bitrix_sync_error    = Column(String, nullable=True)
    bitrix_synced_at     = Column(DateTime, nullable=True)

class UserState(Base):
    __tablename__ = "user_state"
    user_id     = Column(Integer, primary_key=True)
    state_json  = Column(Text, default="{}")
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ── Migrations ───────────────────────────────────────────────
def _run_migrations():
    """Apply schema migrations for columns added after initial deploy."""
    import sqlite3
    db_path = DATABASE_URL.replace('sqlite:///', '')
    try:
        con = sqlite3.connect(db_path)
        cols = [r[1] for r in con.execute("PRAGMA table_info(users)").fetchall()]
        if 'last_login_at' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN last_login_at DATETIME")
        if 'reset_token' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN reset_token VARCHAR")
        if 'reset_token_expires' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN reset_token_expires DATETIME")
        if 'consent' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN consent BOOLEAN DEFAULT 0")
        if 'consent_at' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN consent_at DATETIME")
        if 'phone' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN phone VARCHAR")
        if 'reg_source' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN reg_source VARCHAR")
        if 'notes' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN notes VARCHAR")
        if 'notes_updated_at' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN notes_updated_at DATETIME")
        needs_access_seed = 'access_drinks' not in cols or 'access_finance' not in cols
        if 'access_drinks' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN access_drinks BOOLEAN DEFAULT 0")
        if 'access_finance' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN access_finance BOOLEAN DEFAULT 0")
        if 'access_author' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN access_author BOOLEAN DEFAULT 0")
        if 'avatar_url' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR")
        if 'bitrix_contact_id' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN bitrix_contact_id VARCHAR")
        if 'bitrix_sync_status' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN bitrix_sync_status VARCHAR")
        if 'bitrix_sync_error' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN bitrix_sync_error VARCHAR")
        if 'bitrix_synced_at' not in cols:
            con.execute("ALTER TABLE users ADD COLUMN bitrix_synced_at DATETIME")
        if needs_access_seed:
            con.execute("UPDATE users SET access_drinks=1, access_finance=1 WHERE is_active=1 OR is_admin=1")
        con.execute("UPDATE users SET access_author=1 WHERE is_admin=1")
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration] warning: {e}")

    # oc_library table
    try:
        con = sqlite3.connect(db_path)
        con.execute("""
            CREATE TABLE IF NOT EXISTS oc_library (
                name TEXT, subcategory TEXT, price REAL DEFAULT 0,
                photo TEXT DEFAULT '', url TEXT DEFAULT '',
                category TEXT DEFAULT 'equipment'
            )
        """)
        oc_cols = [r[1] for r in con.execute("PRAGMA table_info(oc_library)").fetchall()]
        if 'category' not in oc_cols:
            con.execute("ALTER TABLE oc_library ADD COLUMN category TEXT DEFAULT 'equipment'")
        if 'is_public' not in oc_cols:
            con.execute("ALTER TABLE oc_library ADD COLUMN is_public INTEGER DEFAULT 1")
        if 'is_featured' not in oc_cols:
            con.execute("ALTER TABLE oc_library ADD COLUMN is_featured INTEGER DEFAULT 0")
        if 'sort_order' not in oc_cols:
            con.execute("ALTER TABLE oc_library ADD COLUMN sort_order INTEGER DEFAULT 0")
        if 'description' not in oc_cols:
            con.execute("ALTER TABLE oc_library ADD COLUMN description TEXT DEFAULT ''")
        if 'promo_code' not in oc_cols:
            con.execute("ALTER TABLE oc_library ADD COLUMN promo_code TEXT DEFAULT ''")
        if 'promo_expires' not in oc_cols:
            con.execute("ALTER TABLE oc_library ADD COLUMN promo_expires TEXT DEFAULT ''")
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration oc_library] warning: {e}")

    # oc_presets table
    try:
        con = sqlite3.connect(db_path)
        con.execute("""
            CREATE TABLE IF NOT EXISTS oc_presets (
                format TEXT NOT NULL,
                lib_item_id INTEGER NOT NULL,
                qty INTEGER DEFAULT 1,
                sort_order INTEGER DEFAULT 0
            )
        """)
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration oc_presets] warning: {e}")

    # sup_library table
    try:
        con = sqlite3.connect(db_path)
        con.execute("""
            CREATE TABLE IF NOT EXISTS sup_library (
                name TEXT NOT NULL,
                phone TEXT DEFAULT '',
                site TEXT DEFAULT '',
                note TEXT DEFAULT '',
                logo_url TEXT DEFAULT '',
                is_public INTEGER DEFAULT 1,
                is_featured INTEGER DEFAULT 0,
                sort_order INTEGER DEFAULT 0,
                promo_code TEXT DEFAULT '',
                promo_expires TEXT DEFAULT '',
                promo_desc TEXT DEFAULT '',
                tags TEXT DEFAULT ''
            )
        """)
        # Заполняем дефолтными поставщиками, если таблица пустая
        count = con.execute("SELECT COUNT(*) FROM sup_library").fetchone()[0]
        if count == 0:
            defaults = [
                ('Rockets.coffee', '+7 925 386-74-20', 'https://b2b.rockets.coffee/', 'Зерно для эспрессо, фильтр-кофе, чай, матча и др.', '', 1, 0, 1, '', '', '', 'кофе'),
                ('Tasty coffee',   '+7 800 333-49-80', 'https://shop.tastycoffee.ru/', 'Зерно эспрессо и фильтр-кофе', '', 1, 0, 2, '', '', '', 'кофе'),
                ('Rocket Tonic',   '+7 800 201-79-69', 'https://rocket-tonic.com/', 'Безалкогольные тоники разных вкусов', '', 1, 0, 3, '', '', '', 'тоники'),
                ('Unicava',        '+7 922 027-11-17', 'https://www.cacava-opt.ru/', 'Bean to Bar шоколад и какао на максималках', '', 1, 0, 4, '', '', '', 'шоколад'),
                ('Петмол',         '+7 999 233-30-04', 'https://mypetmol.ru/', 'Молоко и сливки для бариста', '', 1, 0, 5, '', '', '', 'молоко'),
                ('Вкусов Лаб',     '+7 965 342-88-99', 'https://vkusovlab.ru', 'Аутентичные пряности, перец, соль и сахар премиального качества со всего мира.', '', 1, 0, 6, '', '', '', 'специи'),
                ('Planto',         '+7 800 100-02-01', 'https://logikamoloka.ru/beverages/', 'Напитки на растительной основе для бариста', '', 1, 0, 7, '', '', '', 'молоко'),
            ]
            con.executemany(
                "INSERT INTO sup_library (name,phone,site,note,logo_url,is_public,is_featured,sort_order,promo_code,promo_expires,promo_desc,tags) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                defaults
            )
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration sup_library] warning: {e}")

    # drink_overrides table
    try:
        con = sqlite3.connect(db_path)
        con.execute("""
            CREATE TABLE IF NOT EXISTS drink_overrides (
                drink_id INTEGER PRIMARY KEY,
                name TEXT,
                price REAL,
                is_hidden INTEGER DEFAULT 0,
                updated_at TEXT
            )
        """)
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration drink_overrides] warning: {e}")

    # drink_overrides image_url migration
    try:
        con = sqlite3.connect(db_path)
        con.execute("ALTER TABLE drink_overrides ADD COLUMN image_url TEXT")
        con.commit()
        con.close()
    except Exception as e:
        pass  # column already exists

    # workspaces and team collaboration
    try:
        con = sqlite3.connect(db_path)
        con.execute("""
            CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                owner_user_id INTEGER NOT NULL,
                state_json TEXT DEFAULT '{}',
                created_at TEXT,
                updated_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS workspace_members (
                workspace_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                role TEXT DEFAULT 'editor',
                created_at TEXT,
                PRIMARY KEY (workspace_id, user_id)
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS workspace_invites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id INTEGER NOT NULL,
                email TEXT NOT NULL,
                token TEXT UNIQUE NOT NULL,
                role TEXT DEFAULT 'editor',
                status TEXT DEFAULT 'pending',
                invited_by_user_id INTEGER NOT NULL,
                accepted_by_user_id INTEGER,
                created_at TEXT,
                accepted_at TEXT,
                revoked_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS workspace_activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id INTEGER NOT NULL,
                actor_user_id INTEGER,
                actor_name TEXT DEFAULT '',
                action TEXT NOT NULL,
                target_type TEXT DEFAULT '',
                target_id TEXT DEFAULT '',
                summary TEXT DEFAULT '',
                metadata_json TEXT DEFAULT '{}',
                created_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS workspace_state_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id INTEGER NOT NULL,
                actor_user_id INTEGER,
                actor_name TEXT DEFAULT '',
                reason TEXT DEFAULT 'manual',
                state_json TEXT DEFAULT '{}',
                created_at TEXT NOT NULL
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS workspace_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workspace_id INTEGER NOT NULL,
                note_id TEXT DEFAULT '',
                uploader_user_id INTEGER NOT NULL,
                original_name TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                content_type TEXT DEFAULT '',
                size_bytes INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        for col in ("archived_at", "deleted_at"):
            try:
                con.execute(f"ALTER TABLE workspaces ADD COLUMN {col} TEXT")
            except Exception:
                pass
        con.execute("CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_workspace_invites_token ON workspace_invites(token)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_workspace_activity_workspace ON workspace_activity(workspace_id, created_at)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_workspace_snapshots_workspace ON workspace_state_snapshots(workspace_id, id)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_workspace_files_workspace ON workspace_files(workspace_id, note_id, id)")
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration workspaces] warning: {e}")

    # author profiles, recipe publications, recipe orders
    try:
        con = sqlite3.connect(db_path)
        con.execute("""
            CREATE TABLE IF NOT EXISTS author_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE,
                full_name TEXT DEFAULT '',
                public_name TEXT DEFAULT '',
                first_name TEXT DEFAULT '',
                last_name TEXT DEFAULT '',
                patronymic TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                telegram TEXT DEFAULT '',
                bio TEXT DEFAULT '',
                document_status TEXT DEFAULT 'not_started',
                bitrix_contact_id TEXT DEFAULT '',
                bitrix_sync_status TEXT DEFAULT '',
                bitrix_sync_error TEXT DEFAULT '',
                bitrix_synced_at TEXT DEFAULT '',
                mixology_participant_id TEXT DEFAULT '',
                telegram_chat_id TEXT DEFAULT '',
                telegram_username TEXT DEFAULT '',
                telegram_bound_at TEXT DEFAULT '',
                telegram_notify_enabled INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS recipe_publications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author_user_id INTEGER NOT NULL,
                recipe_local_id TEXT DEFAULT '',
                source_draft_id INTEGER DEFAULT 0,
                version INTEGER DEFAULT 1,
                title TEXT NOT NULL,
                group_name TEXT DEFAULT '',
                volume_ml INTEGER DEFAULT 0,
                price REAL DEFAULT 0,
                cost REAL DEFAULT 0,
                recipe_json TEXT DEFAULT '{}',
                validation_json TEXT DEFAULT '{}',
                public_description TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                video_url TEXT DEFAULT '',
                status TEXT DEFAULT 'submitted',
                review_comment TEXT DEFAULT '',
                review_flags_json TEXT DEFAULT '[]',
                public_slug TEXT UNIQUE,
                bitrix_product_name TEXT DEFAULT '',
                published_at TEXT,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS recipe_publication_versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publication_id INTEGER NOT NULL,
                version INTEGER NOT NULL,
                recipe_json TEXT DEFAULT '{}',
                public_description TEXT DEFAULT '',
                image_url TEXT DEFAULT '',
                video_url TEXT DEFAULT '',
                price REAL DEFAULT 0,
                cost REAL DEFAULT 0,
                validation_json TEXT DEFAULT '{}',
                created_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS recipe_publication_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publication_id INTEGER NOT NULL,
                actor_type TEXT DEFAULT '',
                actor_user_id INTEGER DEFAULT 0,
                event_type TEXT DEFAULT '',
                from_status TEXT DEFAULT '',
                to_status TEXT DEFAULT '',
                version INTEGER DEFAULT 0,
                comment TEXT DEFAULT '',
                review_flags_json TEXT DEFAULT '[]',
                created_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS author_recipe_drafts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author_user_id INTEGER NOT NULL,
                title TEXT DEFAULT '',
                group_name TEXT DEFAULT '',
                volume_ml INTEGER DEFAULT 0,
                price REAL DEFAULT 0,
                draft_json TEXT DEFAULT '{}',
                status TEXT DEFAULT 'draft',
                created_at TEXT,
                updated_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS author_ingredients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author_user_id INTEGER NOT NULL,
                mat_key TEXT NOT NULL,
                name TEXT DEFAULT '',
                category TEXT DEFAULT '',
                ingredient_json TEXT DEFAULT '{}',
                supplier_json TEXT DEFAULT '{}',
                created_at TEXT,
                updated_at TEXT,
                UNIQUE(author_user_id, mat_key)
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS author_semis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                author_user_id INTEGER NOT NULL,
                name TEXT DEFAULT '',
                category TEXT DEFAULT '',
                semi_json TEXT DEFAULT '{}',
                created_at TEXT,
                updated_at TEXT
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS author_championship_participations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                event_key TEXT NOT NULL,
                event_title TEXT DEFAULT '',
                season TEXT DEFAULT '',
                dates_json TEXT DEFAULT '[]',
                source TEXT DEFAULT '',
                external_participant_id TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT,
                UNIQUE(user_id, event_key, source)
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS author_telegram_link_tokens (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at TEXT NOT NULL,
                used_at TEXT DEFAULT '',
                created_at TEXT NOT NULL
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS recipe_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                publication_id INTEGER NOT NULL,
                customer_name TEXT DEFAULT '',
                customer_email TEXT DEFAULT '',
                customer_phone TEXT DEFAULT '',
                comment TEXT DEFAULT '',
                source TEXT DEFAULT 'barista-school.online',
                status TEXT DEFAULT 'new',
                bitrix_deal_id TEXT DEFAULT '',
                created_at TEXT
            )
        """)
        profile_cols = [r[1] for r in con.execute("PRAGMA table_info(author_profiles)").fetchall()]
        for col, ddl in [
            ("bitrix_sync_status", "ALTER TABLE author_profiles ADD COLUMN bitrix_sync_status TEXT DEFAULT ''"),
            ("bitrix_sync_error", "ALTER TABLE author_profiles ADD COLUMN bitrix_sync_error TEXT DEFAULT ''"),
            ("bitrix_synced_at", "ALTER TABLE author_profiles ADD COLUMN bitrix_synced_at TEXT DEFAULT ''"),
            ("first_name", "ALTER TABLE author_profiles ADD COLUMN first_name TEXT DEFAULT ''"),
            ("last_name", "ALTER TABLE author_profiles ADD COLUMN last_name TEXT DEFAULT ''"),
            ("patronymic", "ALTER TABLE author_profiles ADD COLUMN patronymic TEXT DEFAULT ''"),
            ("avatar_url", "ALTER TABLE author_profiles ADD COLUMN avatar_url TEXT DEFAULT ''"),
            ("telegram_chat_id", "ALTER TABLE author_profiles ADD COLUMN telegram_chat_id TEXT DEFAULT ''"),
            ("telegram_username", "ALTER TABLE author_profiles ADD COLUMN telegram_username TEXT DEFAULT ''"),
            ("telegram_bound_at", "ALTER TABLE author_profiles ADD COLUMN telegram_bound_at TEXT DEFAULT ''"),
            ("telegram_notify_enabled", "ALTER TABLE author_profiles ADD COLUMN telegram_notify_enabled INTEGER DEFAULT 1"),
        ]:
            if col not in profile_cols:
                con.execute(ddl)
        pub_cols = [r[1] for r in con.execute("PRAGMA table_info(recipe_publications)").fetchall()]
        for col, ddl in [
            ("source_draft_id", "ALTER TABLE recipe_publications ADD COLUMN source_draft_id INTEGER DEFAULT 0"),
            ("version", "ALTER TABLE recipe_publications ADD COLUMN version INTEGER DEFAULT 1"),
            ("validation_json", "ALTER TABLE recipe_publications ADD COLUMN validation_json TEXT DEFAULT '{}'"),
            ("review_comment", "ALTER TABLE recipe_publications ADD COLUMN review_comment TEXT DEFAULT ''"),
            ("review_flags_json", "ALTER TABLE recipe_publications ADD COLUMN review_flags_json TEXT DEFAULT '[]'"),
            ("public_slug", "ALTER TABLE recipe_publications ADD COLUMN public_slug TEXT"),
            ("bitrix_product_name", "ALTER TABLE recipe_publications ADD COLUMN bitrix_product_name TEXT DEFAULT ''"),
            ("published_at", "ALTER TABLE recipe_publications ADD COLUMN published_at TEXT"),
        ]:
            if col not in pub_cols:
                con.execute(ddl)
        con.execute("CREATE INDEX IF NOT EXISTS idx_recipe_publications_status ON recipe_publications(status)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_recipe_publications_author_status ON recipe_publications(author_user_id,status)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_recipe_publications_updated ON recipe_publications(updated_at)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_recipe_publications_source_draft ON recipe_publications(author_user_id,source_draft_id)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_recipe_publication_versions_pub ON recipe_publication_versions(publication_id,version)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_recipe_publication_events_pub ON recipe_publication_events(publication_id,created_at)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_author_champ_part_user ON author_championship_participations(user_id,updated_at)")
        con.execute("CREATE INDEX IF NOT EXISTS idx_author_tg_tokens_user ON author_telegram_link_tokens(user_id,expires_at)")
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration authors] warning: {e}")

_run_migrations()

# ── Helpers ───────────────────────────────────────────────────
bearer  = HTTPBearer()

def hash_password(p: str) -> str:
    return _bcrypt.hashpw(p.encode('utf-8'), _bcrypt.gensalt()).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def user_access(user: User) -> dict:
    if user.is_admin:
        return {"drinks": True, "finance": True, "author": True}
    return {
        "drinks": bool(user.access_drinks),
        "finance": bool(user.access_finance),
        "author": bool(user.access_author),
    }

def can_create_workspaces(user: User) -> bool:
    return bool(user and (user.is_admin or user.access_drinks or user.access_finance))

def user_account_role(user: User, workspace_role: str = "") -> str:
    if workspace_role == "owner":
        return "owner"
    return "paid" if can_create_workspaces(user) else "guest"

def user_public_payload(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone or "",
        "avatar_url": user.avatar_url or "",
        "is_admin": user.is_admin,
        "access": user_access(user),
        "can_create_workspaces": can_create_workspaces(user),
        "account_role": user_account_role(user),
    }

def normalize_phone_digits(value: str) -> str:
    digits = re.sub(r"\D+", "", value or "")
    if len(digits) == 11 and digits.startswith("8"):
        return "7" + digits[1:]
    if len(digits) == 10:
        return "7" + digits
    return digits

def _mixology_author_access_path() -> str:
    return os.path.join(os.path.dirname(__file__), "data", "mixology_author_access.json")

def _load_mixology_author_access() -> dict:
    path = _mixology_author_access_path()
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        return {}
    except Exception as e:
        print(f"[mixology author access] read warning: {e}")
        return {}

    items = data.get("items") if isinstance(data, dict) else data
    if not isinstance(items, list):
        return {}

    by_phone = {}
    for item in items:
        if not isinstance(item, dict):
            continue
        phone = normalize_phone_digits(item.get("phone") or item.get("phone_digits") or "")
        if not phone:
            continue
        dates = item.get("visited_dates") if isinstance(item.get("visited_dates"), list) else []
        participations = item.get("championship_participations")
        if not isinstance(participations, list):
            participations = []
        by_phone[phone] = {
            "yclients_id": str(item.get("yclients_id") or item.get("client_id") or ""),
            "visited_dates": [str(v) for v in dates if v],
            "championship_participations": _mixology_participations_from_access_item(
                participations,
                [str(v) for v in dates if v],
            ),
        }
    return by_phone

def _mixology_author_match(phone: str) -> Optional[dict]:
    normalized = normalize_phone_digits(phone)
    if not normalized:
        return None
    return _load_mixology_author_access().get(normalized)

def _mixology_participation_season(title: str = "", dates: Optional[List[str]] = None) -> str:
    m = re.search(r"\b(20\d{2})\b", title or "")
    if m:
        return m.group(1)
    for date in dates or []:
        if re.match(r"20\d{2}-", str(date or "")):
            return str(date)[:4]
    return ""

def _mixology_default_participation(dates: Optional[List[str]] = None) -> dict:
    clean_dates = sorted({str(v)[:10] for v in (dates or []) if v})
    season = _mixology_participation_season("", clean_dates)
    return {
        "event_key": f"mixology-cup-{season}" if season else "mixology-cup",
        "event_title": f"MBS MIXOLOGY CUP {season}".strip(),
        "season": season,
        "dates": clean_dates,
        "source": "mixology_author_access",
    }

def _normalize_author_participation(item: dict, fallback_dates: Optional[List[str]] = None) -> Optional[dict]:
    if not isinstance(item, dict):
        return None
    dates_raw = item.get("dates") if isinstance(item.get("dates"), list) else (fallback_dates or [])
    dates = sorted({str(v)[:10] for v in dates_raw if v})
    title = str(item.get("event_title") or item.get("title") or "").strip()
    season = str(item.get("season") or "").strip() or _mixology_participation_season(title, dates)
    key = str(item.get("event_key") or "").strip() or (f"mixology-cup-{season}" if season else "mixology-cup")
    if not key:
        return None
    return {
        "event_key": key,
        "event_title": title or f"MBS MIXOLOGY CUP {season}".strip(),
        "season": season,
        "dates": dates,
        "source": str(item.get("source") or "mixology_author_access").strip() or "mixology_author_access",
    }

def _mixology_participations_from_access_item(items: list, visited_dates: Optional[List[str]] = None) -> list:
    result = []
    for item in items or []:
        normalized = _normalize_author_participation(item, visited_dates)
        if normalized:
            result.append(normalized)
    if not result and visited_dates:
        result.append(_mixology_default_participation(visited_dates))
    by_key = {}
    for item in result:
        key = (item["event_key"], item["source"])
        existing = by_key.get(key)
        if existing:
            existing["dates"] = sorted(set(existing.get("dates") or []) | set(item.get("dates") or []))
        else:
            by_key[key] = item
    return sorted(by_key.values(), key=lambda item: (item.get("season") or "", item.get("event_title") or ""), reverse=True)

def require_author_access(user: User):
    if not user.is_admin and not user.access_author:
        raise HTTPException(status_code=403, detail="Нет доступа автора рецептов")

def app_db_path() -> str:
    return os.path.join(os.path.dirname(__file__), 'data', 'app.db')

def utc_now_iso() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat()

def _json_loads_safe(raw: str, fallback=None):
    try:
        return json.loads(raw or "")
    except Exception:
        return {} if fallback is None else fallback

def _workspace_con():
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    con.row_factory = _sq.Row
    return con

def _default_workspace_name(user: User) -> str:
    base = (user.name or "").strip() or "Моя кофейня"
    return base if "коф" in base.lower() else "Моя кофейня"

def _workspace_row_value(row, key: str, default=None):
    try:
        return row[key] if key in row.keys() else default
    except Exception:
        return default

def _workspace_payload(row, role: str, user: Optional[User] = None) -> dict:
    if not row:
        return {}
    archived_at = _workspace_row_value(row, "archived_at", "") or ""
    deleted_at = _workspace_row_value(row, "deleted_at", "") or ""
    return {
        "id": int(row["id"]),
        "name": row["name"] or "Моя кофейня",
        "owner_user_id": int(row["owner_user_id"] or 0),
        "role": role or "editor",
        "account_role": user_account_role(user, role) if user else ("owner" if role == "owner" else "editor"),
        "can_create_workspaces": can_create_workspaces(user) if user else False,
        "created_at": row["created_at"] or "",
        "updated_at": row["updated_at"] or "",
        "archived_at": archived_at,
        "is_archived": bool(archived_at),
        "deleted_at": deleted_at,
    }

def _workspace_list_for_user(con, user: User) -> list:
    rows = con.execute(
        """
        SELECT w.id,w.name,w.owner_user_id,w.state_json,w.created_at,w.updated_at,w.archived_at,w.deleted_at,m.role AS member_role
        FROM workspace_members m
        JOIN workspaces w ON w.id=m.workspace_id
        WHERE m.user_id=? AND COALESCE(w.archived_at,'')='' AND COALESCE(w.deleted_at,'')=''
        ORDER BY CASE WHEN m.role='owner' THEN 0 ELSE 1 END, w.updated_at DESC, w.id DESC
        """,
        (user.id,),
    ).fetchall()
    return [_workspace_payload(r, r["member_role"], user) for r in rows]

def _workspace_archived_list_for_user(con, user: User) -> list:
    rows = con.execute(
        """
        SELECT w.id,w.name,w.owner_user_id,w.state_json,w.created_at,w.updated_at,w.archived_at,w.deleted_at,m.role AS member_role
        FROM workspace_members m
        JOIN workspaces w ON w.id=m.workspace_id
        WHERE m.user_id=? AND m.role='owner' AND COALESCE(w.archived_at,'')!='' AND COALESCE(w.deleted_at,'')=''
        ORDER BY w.archived_at DESC, w.updated_at DESC, w.id DESC
        """,
        (user.id,),
    ).fetchall()
    return [_workspace_payload(r, r["member_role"], user) for r in rows]

def _ensure_user_workspace(user: User) -> Optional[dict]:
    con = _workspace_con()
    try:
        existing = _workspace_list_for_user(con, user)
        if existing:
            return existing[0]
        if not can_create_workspaces(user):
            return None
        legacy = con.execute("SELECT state_json FROM user_state WHERE user_id=?", (user.id,)).fetchone()
        legacy_state = legacy["state_json"] if legacy and legacy["state_json"] else "{}"
        now = utc_now_iso()
        cur = con.execute(
            "INSERT INTO workspaces (name,owner_user_id,state_json,created_at,updated_at) VALUES (?,?,?,?,?)",
            (_default_workspace_name(user), user.id, legacy_state, now, now),
        )
        workspace_id = int(cur.lastrowid)
        con.execute(
            "INSERT INTO workspace_members (workspace_id,user_id,role,created_at) VALUES (?,?,?,?)",
            (workspace_id, user.id, "owner", now),
        )
        _log_workspace_activity(con, workspace_id, user, "workspace_created", "workspace", str(workspace_id), "Создан личный проект")
        con.commit()
        row = con.execute("SELECT * FROM workspaces WHERE id=?", (workspace_id,)).fetchone()
        return _workspace_payload(row, "owner", user)
    finally:
        con.close()

def _require_workspace(con, workspace_id: int, user: User, owner_required: bool = False):
    row = con.execute(
        """
        SELECT w.*,m.role AS member_role
        FROM workspaces w
        JOIN workspace_members m ON m.workspace_id=w.id
        WHERE w.id=? AND m.user_id=? AND COALESCE(w.archived_at,'')='' AND COALESCE(w.deleted_at,'')=''
        """,
        (workspace_id, user.id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    role = row["member_role"] or "editor"
    if owner_required and role != "owner":
        raise HTTPException(status_code=403, detail="Управлять командой может только владелец проекта")
    return row, role

def _require_workspace_including_archived(con, workspace_id: int, user: User, owner_required: bool = False):
    row = con.execute(
        """
        SELECT w.*,m.role AS member_role
        FROM workspaces w
        JOIN workspace_members m ON m.workspace_id=w.id
        WHERE w.id=? AND m.user_id=? AND COALESCE(w.deleted_at,'')=''
        """,
        (workspace_id, user.id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=403, detail="Нет доступа к проекту")
    role = row["member_role"] or "editor"
    if owner_required and role != "owner":
        raise HTTPException(status_code=403, detail="Управлять проектом может только владелец проекта")
    return row, role

def _workspace_invite_link(token: str) -> str:
    return f"{APP_URL}/?invite={urllib.parse.quote(str(token or ''))}"

def _dedupe_pending_workspace_invites(con, workspace_id: int) -> None:
    rows = con.execute(
        """
        SELECT id,email
        FROM workspace_invites
        WHERE workspace_id=? AND status='pending'
        ORDER BY id DESC
        """,
        (workspace_id,),
    ).fetchall()
    seen = set()
    revoke_ids = []
    for row in rows:
        email = (row["email"] or "").strip().lower()
        if not email:
            revoke_ids.append(int(row["id"]))
            continue
        if email in seen:
            revoke_ids.append(int(row["id"]))
        else:
            seen.add(email)
    if revoke_ids:
        now = utc_now_iso()
        con.executemany(
            "UPDATE workspace_invites SET status='revoked',revoked_at=? WHERE id=?",
            [(now, invite_id) for invite_id in revoke_ids],
        )

def _workspace_snapshot_meta(raw_state: str) -> dict:
    state = _json_loads_safe(raw_state, {})
    loc_index = state.get("locIndex") if isinstance(state, dict) else []
    locations = state.get("locations") if isinstance(state, dict) else {}
    active_id = str(state.get("activeId") or "") if isinstance(state, dict) else ""
    if not isinstance(loc_index, list):
        loc_index = []
    if not isinstance(locations, dict):
        locations = {}
    active_name = ""
    for loc in loc_index:
        if isinstance(loc, dict) and str(loc.get("id") or "") == active_id:
            active_name = str(loc.get("name") or "")
            break
    return {
        "location_count": len(loc_index),
        "active_location": active_name,
    }

def _workspace_snapshot_payload(row) -> dict:
    meta = _workspace_snapshot_meta(row["state_json"] or "{}")
    return {
        "id": int(row["id"]),
        "workspace_id": int(row["workspace_id"]),
        "actor_user_id": int(row["actor_user_id"] or 0),
        "actor_name": row["actor_name"] or "Система",
        "reason": row["reason"] or "manual",
        "created_at": row["created_at"] or "",
        **meta,
    }

def _workspace_file_payload(row, workspace_id: int) -> dict:
    file_id = int(row["id"])
    return {
        "id": file_id,
        "workspace_id": int(row["workspace_id"]),
        "note_id": row["note_id"] or "",
        "name": row["original_name"] or "Файл",
        "content_type": row["content_type"] or "",
        "size": int(row["size_bytes"] or 0),
        "uploaded_by_user_id": int(row["uploader_user_id"] or 0),
        "created_at": row["created_at"] or "",
        "url": f"/api/workspaces/{int(workspace_id)}/files/{file_id}",
    }

def _safe_workspace_filename(name: str, fallback_ext: str) -> str:
    raw = os.path.basename(str(name or "")).strip()
    base, ext = os.path.splitext(raw)
    ext = ext.lower().lstrip(".") or fallback_ext
    if ext == "jpeg":
        ext = "jpg"
    base = re.sub(r"[^A-Za-z0-9А-Яа-яЁё._ -]+", "_", base).strip(" ._-")[:80] or "file"
    return f"{base}.{ext}"

def _create_workspace_snapshot(con, workspace_row, actor: Optional[User], reason: str = "manual"):
    workspace_id = int(workspace_row["id"])
    raw_state = workspace_row["state_json"] or "{}"
    actor_id = actor.id if actor else None
    actor_name = (actor.name or actor.email or "") if actor else "Система"
    cur = con.execute(
        """
        INSERT INTO workspace_state_snapshots
            (workspace_id,actor_user_id,actor_name,reason,state_json,created_at)
        VALUES (?,?,?,?,?,?)
        """,
        (workspace_id, actor_id, actor_name, str(reason or "manual")[:80], raw_state, utc_now_iso()),
    )
    con.execute(
        """
        DELETE FROM workspace_state_snapshots
        WHERE workspace_id=? AND id NOT IN (
            SELECT id FROM workspace_state_snapshots
            WHERE workspace_id=?
            ORDER BY id DESC
            LIMIT 40
        )
        """,
        (workspace_id, workspace_id),
    )
    return int(cur.lastrowid)

def _workspace_state_location_ids(state: dict) -> set:
    if not isinstance(state, dict):
        return set()
    ids = set()
    loc_index = state.get("locIndex")
    if isinstance(loc_index, list):
        for loc in loc_index:
            if isinstance(loc, dict) and loc.get("id") is not None:
                ids.add(str(loc.get("id")))
    locations = state.get("locations")
    if isinstance(locations, dict):
        ids.update(str(k) for k in locations.keys() if k is not None)
    return ids

def _workspace_state_locations(state: dict) -> dict:
    if not isinstance(state, dict):
        return {}
    locations = state.get("locations")
    return locations if isinstance(locations, dict) else {}

def _workspace_state_loc_index_by_id(state: dict) -> dict:
    if not isinstance(state, dict):
        return {}
    loc_index = state.get("locIndex")
    if not isinstance(loc_index, list):
        return {}
    out = {}
    for loc in loc_index:
        if isinstance(loc, dict) and loc.get("id") is not None:
            out[str(loc.get("id"))] = loc
    return out

def _stable_json(value) -> str:
    try:
        return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    except Exception:
        return str(value)

def _item_identity_set(items, id_fields=("id", "key", "name")) -> set:
    if not isinstance(items, list):
        return set()
    out = set()
    for item in items:
        if not isinstance(item, dict):
            continue
        value = None
        for field in id_fields:
            if item.get(field) is not None and str(item.get(field)) != "":
                value = item.get(field)
                break
        if value is not None:
            out.add(str(value))
    return out

def _dict_key_set(value) -> set:
    return set(str(k) for k in value.keys()) if isinstance(value, dict) else set()

def _container_size(value) -> int:
    if isinstance(value, (list, dict)):
        return len(value)
    return 0

def _state_path_value(value, path: tuple):
    cur = value
    for key in path:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(key)
    return cur

def _workspace_destructive_changes(old_state: dict, new_state: dict) -> list:
    """Return human-readable protected structural/destructive workspace changes."""
    changes = []
    old_location_ids = _workspace_state_location_ids(old_state)
    new_location_ids = _workspace_state_location_ids(new_state)
    for loc_id in sorted(new_location_ids - old_location_ids):
        changes.append(f"location_added:{loc_id}")
    for loc_id in sorted(old_location_ids - new_location_ids):
        changes.append(f"location:{loc_id}")

    old_loc_index = _workspace_state_loc_index_by_id(old_state)
    new_loc_index = _workspace_state_loc_index_by_id(new_state)
    for loc_id in sorted(old_location_ids & new_location_ids):
        if _stable_json(old_loc_index.get(loc_id, {})) != _stable_json(new_loc_index.get(loc_id, {})):
            changes.append(f"location_changed:{loc_id}")

    old_locations = _workspace_state_locations(old_state)
    new_locations = _workspace_state_locations(new_state)
    for loc_id in sorted(old_location_ids & new_location_ids):
        old_loc = old_locations.get(loc_id)
        new_loc = new_locations.get(loc_id)
        if not isinstance(old_loc, dict) or not isinstance(new_loc, dict):
            continue
        checks = [
            ("recipe", _item_identity_set(old_loc.get("customDrinks")), _item_identity_set(new_loc.get("customDrinks"))),
            ("ingredient", _item_identity_set(old_loc.get("customMats"), ("key", "id", "name")), _item_identity_set(new_loc.get("customMats"), ("key", "id", "name"))),
            ("semi", _item_identity_set(old_loc.get("semiItems")), _item_identity_set(new_loc.get("semiItems"))),
            ("supplier", _dict_key_set(old_loc.get("suppliers")), _dict_key_set(new_loc.get("suppliers"))),
            ("supplier_book", _item_identity_set(old_loc.get("supplierBook")), _item_identity_set(new_loc.get("supplierBook"))),
        ]
        for label, before, after in checks:
            for item_id in sorted(before - after):
                changes.append(f"{label}:{loc_id}:{item_id}")

        clear_checks = [
            ("opening_costs_cleared", old_loc.get("openingCosts"), new_loc.get("openingCosts")),
            ("addon_sales_cleared", old_loc.get("addonSales"), new_loc.get("addonSales")),
            ("fixed_costs_cleared", old_loc.get("fixedCosts"), new_loc.get("fixedCosts")),
            ("payroll_positions_cleared", old_loc.get("payrollPositions"), new_loc.get("payrollPositions")),
            ("price_log_cleared", old_loc.get("priceLog"), new_loc.get("priceLog")),
        ]
        for label, before, after in clear_checks:
            if _container_size(before) >= 2 and _container_size(after) == 0:
                changes.append(f"{label}:{loc_id}")

        reset_sensitive_paths = [
            ("prices",),
            ("salePrices",),
            ("portions",),
            ("fixedCosts",),
            ("taxMode",),
            ("investment",),
            ("payroll",),
            ("payrollPositions",),
            ("payrollSettings",),
            ("seasonality",),
            ("salesMeta",),
            ("addonSales",),
            ("suppliers",),
            ("priceLog",),
            ("openingCosts",),
        ]
        changed_sensitive = []
        for path in reset_sensitive_paths:
            before = _state_path_value(old_loc, path)
            after = _state_path_value(new_loc, path)
            if _stable_json(before) != _stable_json(after):
                changed_sensitive.append(".".join(path))
        if len(changed_sensitive) >= 5:
            changes.append(f"bulk_reset:{loc_id}:{','.join(changed_sensitive[:8])}")
    return changes

def _require_safe_workspace_state_update(con, workspace_row, role: str, user: User, next_state: dict):
    if user.is_admin or role == "owner":
        return
    current_state = _json_loads_safe(workspace_row["state_json"] or "{}", {})
    changes = _workspace_destructive_changes(current_state, next_state)
    if changes:
        preview = ", ".join(changes[:5])
        if len(changes) > 5:
            preview += f", +{len(changes) - 5}"
        _log_workspace_activity(
            con,
            int(workspace_row["id"]),
            user,
            "state_update_blocked",
            "workspace",
            str(workspace_row["id"]),
            "Заблокирована критическая перезапись проекта",
            {"changes": changes[:50]},
        )
        con.commit()
        raise HTTPException(
            status_code=403,
            detail=f"Менять структуру заведений и удалять ключевые сущности проекта может только владелец проекта: {preview}",
        )

def _maybe_auto_workspace_snapshot(con, workspace_row, actor: Optional[User], next_state_json: str) -> None:
    current_state_json = workspace_row["state_json"] or "{}"
    if current_state_json == next_state_json:
        return
    workspace_id = int(workspace_row["id"])
    latest = con.execute(
        """
        SELECT created_at FROM workspace_state_snapshots
        WHERE workspace_id=? AND reason='autosave'
        ORDER BY id DESC LIMIT 1
        """,
        (workspace_id,),
    ).fetchone()
    if latest and latest["created_at"]:
        try:
            last_dt = datetime.fromisoformat(str(latest["created_at"]))
            if datetime.utcnow() - last_dt < timedelta(minutes=15):
                return
        except Exception:
            pass
    _create_workspace_snapshot(con, workspace_row, actor, "autosave")

WORKSPACE_ACTIVITY_ACTIONS = {
    "project_opened",
    "workspace_created",
    "workspace_renamed",
    "workspace_switched",
    "workspace_reset",
    "workspace_archived",
    "workspace_restored",
    "workspace_deleted",
    "snapshot_created",
    "snapshot_restored",
    "invite_created",
    "invite_accepted",
    "invite_revoked",
    "member_removed",
    "location_created",
    "location_renamed",
    "location_deleted",
    "opening_costs_changed",
    "finmodel_changed",
    "payroll_changed",
    "sales_changed",
    "recipe_changed",
    "supplier_changed",
    "export_created",
}

WORKSPACE_OWNER_ACTIVITY_ACTIONS = {
    "workspace_created",
    "workspace_renamed",
    "workspace_reset",
    "workspace_archived",
    "workspace_restored",
    "workspace_deleted",
    "snapshot_created",
    "snapshot_restored",
    "invite_created",
    "invite_revoked",
    "member_removed",
    "location_created",
    "location_renamed",
    "location_deleted",
}

def _workspace_role_is_owner(user: User, role: str = "") -> bool:
    return bool(user and (user.is_admin or role == "owner"))

def _require_workspace_owner_activity(user: User, role: str, action: str) -> None:
    if action in WORKSPACE_OWNER_ACTIVITY_ACTIONS and not _workspace_role_is_owner(user, role):
        raise HTTPException(status_code=403, detail="Это событие может фиксировать только владелец проекта")

def _log_workspace_activity(con, workspace_id: int, actor: Optional[User], action: str, target_type: str = "", target_id: str = "", summary: str = "", metadata: Optional[dict] = None) -> None:
    if not workspace_id or not action:
        return
    actor_name = ""
    actor_id = None
    if actor:
        actor_id = actor.id
        actor_name = actor.name or actor.email or ""
    con.execute(
        """
        INSERT INTO workspace_activity
            (workspace_id,actor_user_id,actor_name,action,target_type,target_id,summary,metadata_json,created_at)
        VALUES (?,?,?,?,?,?,?,?,?)
        """,
        (
            workspace_id,
            actor_id,
            actor_name,
            str(action)[:80],
            str(target_type or "")[:80],
            str(target_id or "")[:120],
            str(summary or "")[:500],
            json.dumps(metadata or {}, ensure_ascii=False),
            utc_now_iso(),
        ),
    )

def _log_project_opened_throttled(con, workspace_id: int, user: User, minutes: int = 30) -> None:
    latest = con.execute(
        """
        SELECT created_at FROM workspace_activity
        WHERE workspace_id=? AND actor_user_id=? AND action='project_opened'
        ORDER BY id DESC LIMIT 1
        """,
        (workspace_id, user.id),
    ).fetchone()
    if latest and latest["created_at"]:
        try:
            last_dt = datetime.fromisoformat(str(latest["created_at"]))
            if datetime.utcnow() - last_dt < timedelta(minutes=minutes):
                return
        except Exception:
            pass
    _log_workspace_activity(con, workspace_id, user, "project_opened", "workspace", str(workspace_id), "Открыл проект")

def _pending_invite_for_token(con, token: str, email: str = ""):
    token = (token or "").strip()
    if not token:
        return None
    row = con.execute("SELECT * FROM workspace_invites WHERE token=?", (token,)).fetchone()
    if not row or row["status"] != "pending":
        raise HTTPException(status_code=404, detail="Приглашение не найдено или уже использовано")
    if email and (row["email"] or "").lower() != email.lower():
        raise HTTPException(status_code=403, detail="Приглашение выписано на другой email")
    return row

def _accept_workspace_invite_for_user(con, invite_row, user: User):
    if not invite_row:
        raise HTTPException(status_code=404, detail="Приглашение не найдено")
    if (invite_row["email"] or "").lower() != (user.email or "").lower():
        raise HTTPException(status_code=403, detail="Приглашение выписано на другой email")
    workspace_id = int(invite_row["workspace_id"])
    now = utc_now_iso()
    con.execute(
        "INSERT OR IGNORE INTO workspace_members (workspace_id,user_id,role,created_at) VALUES (?,?,?,?)",
        (workspace_id, user.id, invite_row["role"] or "editor", now),
    )
    con.execute(
        "UPDATE workspace_invites SET status='accepted',accepted_by_user_id=?,accepted_at=? WHERE id=?",
        (user.id, now, invite_row["id"]),
    )
    _log_workspace_activity(con, workspace_id, user, "invite_accepted", "member", str(user.id), f"Принял приглашение {user.email}")
    workspace, role = _require_workspace(con, workspace_id, user)
    return workspace, role

def public_upload_owner_token(user_id: int) -> str:
    raw = f"{SECRET_KEY}:public-upload:{int(user_id or 0)}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]

def _create_oauth_exchange(token: str, user: dict) -> str:
    now = time.time()
    for code, item in list(_oauth_exchange_codes.items()):
        if item.get("expires_at", 0) <= now:
            _oauth_exchange_codes.pop(code, None)
    code = secrets.token_urlsafe(32)
    _oauth_exchange_codes[code] = {
        "token": token,
        "user": user,
        "expires_at": now + OAUTH_EXCHANGE_TTL_SECONDS,
    }
    return code

def _consume_oauth_exchange(code: str) -> dict | None:
    item = _oauth_exchange_codes.pop(str(code or "").strip(), None)
    if not item or item.get("expires_at", 0) <= time.time():
        return None
    return {"token": item.get("token", ""), "user": item.get("user") or {}}

def slugify_recipe(value: str, fallback: str = "recipe") -> str:
    raw = (value or "").strip().lower()
    translit = {
        "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"e","ж":"zh","з":"z","и":"i","й":"y",
        "к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f",
        "х":"h","ц":"c","ч":"ch","ш":"sh","щ":"sch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
    }
    s = "".join(translit.get(ch, ch) for ch in raw)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or fallback

def ensure_unique_slug(con, title: str, row_id: Optional[int] = None) -> str:
    base = slugify_recipe(title)
    slug = base
    i = 2
    while True:
        if row_id:
            found = con.execute(
                "SELECT id FROM recipe_publications WHERE public_slug=? AND id<>?",
                (slug, row_id),
            ).fetchone()
        else:
            found = con.execute("SELECT id FROM recipe_publications WHERE public_slug=?", (slug,)).fetchone()
        if not found:
            return slug
        slug = f"{base}-{i}"
        i += 1

def _split_legacy_author_name(full_name: str = "", public_name: str = "") -> dict:
    raw = (full_name or public_name or "").strip()
    parts = [p for p in re.split(r"\s+", raw) if p]
    public_parts = [p for p in re.split(r"\s+", (public_name or "").strip()) if p]
    public_first = public_parts[0] if len(public_parts) == 1 else ""
    if len(parts) >= 3:
        return {"last_name": parts[0], "first_name": parts[1], "patronymic": " ".join(parts[2:])}
    if len(parts) == 2:
        if public_first and parts[1].lower() == public_first.lower():
            return {"last_name": parts[0], "first_name": parts[1], "patronymic": ""}
        if public_first and parts[0].lower() == public_first.lower():
            return {"last_name": parts[1], "first_name": parts[0], "patronymic": ""}
        return {"last_name": parts[1], "first_name": parts[0], "patronymic": ""}
    if len(parts) == 1:
        return {"last_name": "", "first_name": parts[0], "patronymic": ""}
    return {"last_name": "", "first_name": "", "patronymic": ""}

def _author_full_name(first_name: str = "", last_name: str = "", patronymic: str = "") -> str:
    return " ".join([x.strip() for x in [last_name, first_name, patronymic] if x and x.strip()])

def _author_public_name(first_name: str = "", last_name: str = "", fallback: str = "") -> str:
    public_name = " ".join([x.strip() for x in [first_name, last_name] if x and x.strip()])
    return public_name or (fallback or "").strip()

AUTHOR_PROFILE_COLUMNS = (
    "id,user_id,full_name,public_name,phone,email,telegram,bio,document_status,"
    "bitrix_contact_id,bitrix_sync_status,bitrix_sync_error,bitrix_synced_at,"
    "mixology_participant_id,created_at,updated_at,first_name,last_name,patronymic,avatar_url,"
    "telegram_chat_id,telegram_username,telegram_bound_at,telegram_notify_enabled"
)

def author_profile_row(r):
    if not r:
        return None
    first_name = r[16] if len(r) > 16 and r[16] else ""
    last_name = r[17] if len(r) > 17 and r[17] else ""
    patronymic = r[18] if len(r) > 18 and r[18] else ""
    if not first_name and not last_name and not patronymic:
        legacy = _split_legacy_author_name(r[2] or "", r[3] or "")
        first_name = legacy["first_name"]
        last_name = legacy["last_name"]
        patronymic = legacy["patronymic"]
    avatar_url = r[19] if len(r) > 19 and r[19] else ""
    telegram_chat_id = r[20] if len(r) > 20 and r[20] else ""
    telegram_username = r[21] if len(r) > 21 and r[21] else ""
    telegram_bound_at = r[22] if len(r) > 22 and r[22] else ""
    telegram_notify_enabled = bool(r[23]) if len(r) > 23 else True
    full_name = _author_full_name(first_name, last_name, patronymic) or (r[2] or "")
    public_name = _author_public_name(first_name, last_name, r[3] or "")
    return {
        "id": r[0],
        "user_id": r[1],
        "full_name": full_name,
        "public_name": public_name,
        "first_name": first_name,
        "last_name": last_name,
        "patronymic": patronymic,
        "avatar_url": avatar_url,
        "phone": r[4] or "",
        "email": r[5] or "",
        "telegram": r[6] or "",
        "bio": r[7] or "",
        "document_status": r[8] or "not_started",
        "bitrix_contact_id": r[9] or "",
        "bitrix_sync_status": r[10] or "",
        "bitrix_sync_error": r[11] or "",
        "bitrix_synced_at": r[12] or "",
        "mixology_participant_id": r[13] or "",
        "created_at": r[14] or "",
        "updated_at": r[15] or "",
        "telegram_connected": bool(telegram_chat_id),
        "telegram_username": telegram_username,
        "telegram_bound_at": telegram_bound_at,
        "telegram_notify_enabled": telegram_notify_enabled,
    }

def _author_participation_row(r):
    try:
        dates = json.loads(r[4] or "[]")
        if not isinstance(dates, list):
            dates = []
    except Exception:
        dates = []
    return {
        "event_key": r[1] or "",
        "event_title": r[2] or "",
        "season": r[3] or "",
        "dates": [str(v) for v in dates if v],
        "source": r[5] or "",
    }

def _author_championship_participations(con, user_id: int) -> list:
    rows = con.execute(
        """
        SELECT id,event_key,event_title,season,dates_json,source
        FROM author_championship_participations
        WHERE user_id=?
        ORDER BY season DESC, event_title ASC, id ASC
        """,
        (user_id,),
    ).fetchall()
    return [_author_participation_row(r) for r in rows]

def _sync_author_championship_participations(con, user: User, match: Optional[dict] = None) -> None:
    if match is None:
        match = _mixology_author_match(user.phone or "")
    if not match:
        return
    now = utc_now_iso()
    participations = match.get("championship_participations") or _mixology_participations_from_access_item(
        [],
        match.get("visited_dates") or [],
    )
    for item in participations:
        normalized = _normalize_author_participation(item, match.get("visited_dates") or [])
        if not normalized:
            continue
        con.execute(
            """
            INSERT INTO author_championship_participations
                (user_id,event_key,event_title,season,dates_json,source,external_participant_id,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?)
            ON CONFLICT(user_id,event_key,source) DO UPDATE SET
                event_title=excluded.event_title,
                season=excluded.season,
                dates_json=excluded.dates_json,
                external_participant_id=excluded.external_participant_id,
                updated_at=excluded.updated_at
            """,
            (
                user.id,
                normalized["event_key"],
                normalized["event_title"],
                normalized["season"],
                json.dumps(normalized["dates"], ensure_ascii=False, separators=(",", ":")),
                normalized["source"],
                str(match.get("yclients_id") or ""),
                now,
                now,
            ),
        )

def publication_row(r, include_private: bool = False):
    if not r:
        return None
    try:
        recipe_data = json.loads(r[10] or "{}")
        if not isinstance(recipe_data, dict):
            recipe_data = {}
    except Exception:
        recipe_data = {}
    try:
        validation = json.loads(r[11] or "{}")
        if not isinstance(validation, dict):
            validation = {}
    except Exception:
        validation = {}
    try:
        review_flags = json.loads(r[17] or "[]")
        if not isinstance(review_flags, list):
            review_flags = []
    except Exception:
        review_flags = []
    draft_data = recipe_data.get("draft") or {}
    if not isinstance(draft_data, dict):
        draft_data = {}
    recipe_image = (
        recipe_data.get("image_url")
        or recipe_data.get("image")
        or draft_data.get("image")
        or ""
    )
    data = {
        "id": r[0],
        "author_user_id": r[1],
        "recipe_local_id": r[2] or "",
        "source_draft_id": r[3] or 0,
        "version": r[4] or 1,
        "title": r[5] or "",
        "group_name": r[6] or "",
        "volume_ml": r[7] or 0,
        "price": r[8] or 0,
        "cost": r[9] or 0,
        "public_description": r[12] or "",
        "image_url": r[13] or recipe_image,
        "video_url": r[14] or "",
        "status": r[15] or "submitted",
        "review_comment": r[16] or "",
        "public_slug": r[18] or "",
        "bitrix_product_name": r[19] or "",
        "published_at": r[20] or "",
        "created_at": r[21] or "",
        "updated_at": r[22] or "",
    }
    if include_private:
        data["review_flags"] = [str(x) for x in review_flags if str(x).strip()]
        data["validation"] = validation
        data["recipe"] = recipe_data
    return data

AUTHOR_DRAFT_CLIENT_ID_OFFSET = 100000000
AUTHOR_SEMI_CLIENT_ID_OFFSET = 200000000

def author_draft_client_id(draft_id: int) -> int:
    return AUTHOR_DRAFT_CLIENT_ID_OFFSET + int(draft_id or 0)

def author_semi_client_id(semi_id: int) -> int:
    return AUTHOR_SEMI_CLIENT_ID_OFFSET + int(semi_id or 0)

def author_draft_row(r):
    if not r:
        return None
    try:
        draft = json.loads(r[6] or "{}")
    except Exception:
        draft = {}
    draft_id = int(r[0])
    client_id = author_draft_client_id(draft_id)
    drink = {
        **draft,
        "id": client_id,
        "_authorDraftId": draft_id,
        "_authorDraft": True,
        "custom": True,
        "name": r[2] or draft.get("name") or "",
        "group": r[3] or draft.get("group") or "hot",
        "vol": r[4] or draft.get("vol") or 0,
        "price": r[5] or draft.get("price") or 0,
    }
    if not isinstance(drink.get("recipe"), list):
        drink["recipe"] = []
    return {
        "id": draft_id,
        "client_id": client_id,
        "status": r[7] or "draft",
        "updated_at": r[9] or "",
        "drink": drink,
    }

def author_ingredient_row(r):
    if not r:
        return None
    try:
        ingredient = json.loads(r[5] or "{}")
    except Exception:
        ingredient = {}
    try:
        supplier = json.loads(r[6] or "{}")
    except Exception:
        supplier = {}
    mat_key = r[2] or ""
    ingredient["custom"] = True
    ingredient["_authorIngredient"] = True
    return {
        "id": r[0],
        "key": mat_key,
        "ingredient": ingredient,
        "supplier": supplier,
        "updated_at": r[8] or "",
    }

def author_semi_row(r):
    if not r:
        return None
    try:
        semi = json.loads(r[4] or "{}")
    except Exception:
        semi = {}
    semi_id = int(r[0])
    client_id = author_semi_client_id(semi_id)
    semi = {
        **semi,
        "id": client_id,
        "_authorSemiId": semi_id,
        "_authorSemi": True,
        "name": r[2] or semi.get("name") or "",
        "category": r[3] or semi.get("category") or "semi_default",
    }
    if not isinstance(semi.get("recipe"), list):
        semi["recipe"] = []
    return {
        "id": semi_id,
        "client_id": client_id,
        "semi": semi,
        "updated_at": r[6] or "",
    }

def public_author_profile(con, user_id: int) -> dict:
    row = con.execute(
        f"SELECT {AUTHOR_PROFILE_COLUMNS} FROM author_profiles WHERE user_id=?",
        (user_id,),
    ).fetchone()
    profile = author_profile_row(row) if row else {}
    return {
        "name": profile.get("public_name") or "",
        "bio": profile.get("bio") or "",
        "avatar_url": profile.get("avatar_url") or "",
    }

def _public_group_label(group_name: str) -> str:
    labels = {
        "author": "Авторские",
        "Авторские": "Авторские",
        "hot": "Горячие",
        "tea": "Чай",
        "cold": "Холодные",
        "pourover": "Пуровер",
    }
    value = (group_name or "").strip()
    return labels.get(value, value or "Авторские")

def _is_mixology_publication(item: dict) -> bool:
    haystack = " ".join([
        str(item.get("title") or ""),
        str(item.get("group_name") or ""),
        str(item.get("public_description") or ""),
    ]).lower()
    return "mixology" in haystack or "миксолог" in haystack

def public_publication_item(con, row) -> dict:
    item = publication_row(row, include_private=False)
    item["author"] = public_author_profile(con, item.get("author_user_id") or 0)
    item["category"] = _public_group_label(item.get("group_name") or "")
    item["is_mixology"] = _is_mixology_publication(item)
    for private_key in [
        "author_user_id",
        "recipe_local_id",
        "source_draft_id",
        "cost",
        "review_comment",
        "bitrix_product_name",
    ]:
        item.pop(private_key, None)
    return item

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Неверный токен")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт ожидает активации")
    return user

def get_admin_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Нет прав")
    return user

# ── Telegram ──────────────────────────────────────────────────
def _tg_call(method: str, payload: dict) -> dict:
    """Вызов Telegram Bot API."""
    if not TG_TOKEN:
        return {}
    url = f"https://api.telegram.org/bot{TG_TOKEN}/{method}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception:
        return {}

def _join_tg_call(method: str, payload: dict) -> dict:
    """Вызов Telegram Bot API для @Join_MBS_bot."""
    if not JOIN_MBS_BOT_TOKEN:
        return {}
    url = f"https://api.telegram.org/bot{JOIN_MBS_BOT_TOKEN}/{method}"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"[join_mbs_bot] {method} warning: {e}")
        return {}

def _join_tg_send(chat_id: str | int, text: str, reply_markup: dict | None = None) -> dict:
    if not JOIN_MBS_BOT_TOKEN or not chat_id:
        return {}
    payload = {
        "chat_id": str(chat_id),
        "text": text,
        "disable_web_page_preview": True,
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return _join_tg_call("sendMessage", payload)

def _join_inline_keyboard(rows: list[list[tuple[str, str]]]) -> dict:
    keyboard = []
    for row in rows:
        keyboard_row = []
        for title, action in row:
            button = {"text": title}
            if action.startswith("http://") or action.startswith("https://"):
                button["url"] = action
            else:
                button["callback_data"] = action
            keyboard_row.append(button)
        keyboard.append(keyboard_row)
    return {"inline_keyboard": keyboard}

def _join_main_menu_markup() -> dict:
    return _join_inline_keyboard([
        [("🎓 Курсы", "mbs:menu:courses"), ("📅 События", "mbs:menu:events")],
        [("🎁 Подарочные сертификаты", "mbs:menu:gifts")],
        [("💬 Задать вопрос", "mbs:menu:question")],
        [("📞 Контакты", "mbs:menu:contacts")],
        [("🔥 Наш Telegram-канал", "https://t.me/moscowbaristaschool")],
    ])

def _join_course_cta_markup(
    *,
    online_url: str = "",
    gift_label: str = "Оформить сертификат",
    gift_url: str = "https://baristaschool.ru/sertifikat",
) -> dict:
    rows = []
    if online_url:
        rows.append([("Записаться онлайн", online_url)])
    rows.append([("Оставить заявку", "mbs:menu:lead")])
    rows.append([(gift_label, gift_url)])
    rows.append([("⬅️ Назад к курсам", "mbs:menu:courses"), ("Главное меню", "mbs:menu:main")])
    return _join_inline_keyboard(rows)

def _join_send_main_menu(chat_id: str | int) -> dict:
    return _join_tg_send(
        chat_id,
        "Добро пожаловать в бота Московской школы Бариста.\n\n"
        "Здесь вы можете узнать о наших курсах и быстро записаться на занятия",
        _join_main_menu_markup(),
    )

def _join_send_courses_menu(chat_id: str | int) -> dict:
    return _join_tg_send(
        chat_id,
        "Чтобы подобрать подходящий курс, давай определим, какие у тебя цели",
        _join_inline_keyboard([
            [("🎓 Хочу стать бариста", "mbs:goal:new")],
            [("👩‍🍳 Хочу готовить вкусный кофе дома", "mbs:goal:home")],
            [("☕️ Я бариста, хочу улучшить навыки", "mbs:goal:pro")],
            [("🏢 Открываю кофейню", "mbs:goal:cafe")],
            [("Главное меню", "mbs:menu:main")],
        ]),
    )

def _join_send_goal_menu(chat_id: str | int, goal: str) -> dict:
    if goal == "new":
        return _join_tg_send(
            chat_id,
            "Отлично!\nУ нас есть три варианта обучения для будущих бариста — выберите, какая программа вам больше подходит",
            _join_inline_keyboard([
                [("Бариста любитель", "mbs:course:barista3")],
                [("Базовый курс бариста", "mbs:course:basic")],
                [("Продвинутый курс бариста", "mbs:course:probarista")],
                [("Групповой базовый курс бариста", "mbs:course:group")],
                [("Назад", "mbs:menu:courses")],
            ]),
        )
    if goal == "home":
        return _join_tg_send(
            chat_id,
            "Отлично!\nВот список программ которые могу для вас подойти",
            _join_inline_keyboard([
                [("Домашний бариста", "mbs:course:home")],
                [("Базовый курс бариста", "mbs:course:basic")],
                [("Альтернативные способы", "mbs:course:alternative")],
                [("Назад", "mbs:menu:courses")],
            ]),
        )
    if goal == "pro":
        return _join_tg_send(
            chat_id,
            "Отлично!\nРаз вы уже бариста, предлагаем углубить навыки в следующих направлениях",
            _join_inline_keyboard([
                [("Программа «Латте-арт»", "mbs:course:latteart")],
                [("Профессиональный курс бариста", "mbs:course:expert")],
                [("Альтернативные способы", "mbs:course:alternative")],
                [("Назад", "mbs:menu:courses")],
            ]),
        )
    if goal == "cafe":
        return _join_tg_send(
            chat_id,
            "Прекрасно, что вы открываете кофейню!\n"
            "Чтобы подобрать подходящий формат поддержки, уточните, что вам сейчас актуальнее 👇",
            _join_inline_keyboard([
                [("Курс открытие кофейни", "mbs:cafe:open")],
                [("Проектировка бара", "mbs:cafe:bar")],
                [("Меню напитков для кофейни", "mbs:cafe:menu")],
                [("Назад", "mbs:menu:courses")],
            ]),
        )
    return _join_send_courses_menu(chat_id)

def _join_send_course_card(chat_id: str | int, course: str) -> dict:
    cards = {
        "barista3": (
            "Мастер-класс «Бариста-любитель»\n\n"
            "Формат: индивидуальное занятие\n"
            "Продолжительность: 3 часа\n"
            "Программа: знакомство с работой бариста, приготовление эспрессо и молочных напитков, "
            "настройка помола, взбивание молока, базовые принципы работы с кофемашиной и кофемолкой.\n\n"
            "Стоимость:\n10 000 ₽ (1 участник)\n14 000 ₽ (2 участника)\n\n"
            "Подробнее: https://baristaschool.ru/barista_3",
            _join_course_cta_markup(online_url="https://baristaschool.ru/barista_3"),
        ),
        "basic": (
            "Базовый курс бариста\n\n"
            "Формат: индивидуальные занятия 1 на 1 с тренером\n"
            "Продолжительность: 3 занятия по 3 часа (9 часов практики)\n"
            "Программа: основы работы с эспрессо-машиной и помолом, классические напитки, вводный латте-арт, "
            "организация рабочего пространства и ответы на вопросы.\n\n"
            "Стоимость:\n22 000 ₽ (1 участник)\n30 000 ₽ (2 участника)\n\n"
            "Подробнее: https://baristaschool.ru/barista_courses",
            _join_course_cta_markup(online_url="https://baristaschool.ru/barista_courses"),
        ),
        "probarista": (
            "Продвинутый курс бариста\n\n"
            "Формат: индивидуальное обучение\n"
            "Продолжительность: 6 занятий по 3 часа (18 ч)\n"
            "Чему научимся: точная настройка эспрессо, сложный латте-арт, уход за оборудованием, каппинг, "
            "контроль качества и уверенная работа за баром.\n\n"
            "Стоимость:\n35 000 ₽ (1 участник)\n45 000 ₽ (2 участника)\n\n"
            "Подробнее: https://baristaschool.ru/probarista",
            _join_course_cta_markup(gift_label="Оформить в подарок"),
        ),
        "group": (
            "Групповой базовый курс Бариста\n\n"
            "Формат: группа до 4 человек, 4 занятия по 3 часа (12 ч)\n"
            "Программа: основы работы с эспрессо-машиной и помолом, классические напитки, введение в латте-арт, "
            "организация рабочего места и обслуживание оборудования.\n\n"
            "Стоимость: 18 000 ₽\n"
            "Подробнее: https://baristaschool.ru/group",
            _join_course_cta_markup(gift_label="Оформить в подарок"),
        ),
        "home": (
            "Домашний бариста\n\n"
            "Формат: индивидуальное занятие\n"
            "Продолжительность: 3 часа\n"
            "Программа адаптируется под ваши запросы — от фильтр-кофе и френч-пресса до работы на профессиональной кофемашине.\n\n"
            "Стоимость:\n10 000 ₽ (1 участник)\n14 000 ₽ (2 участника)\n\n"
            "Подробнее: https://baristaschool.ru/home_barista",
            _join_course_cta_markup(online_url="https://baristaschool.ru/home_barista"),
        ),
        "alternative": (
            "Курс «Альтернативные методы заваривания»\n\n"
            "Формат: индивидуальное занятие\n"
            "Продолжительность: 2 занятия по 3 часа (6 часов практики)\n"
            "Чему научимся: френч-пресс, AeroPress, V60, Chemex, подбор помола, воды и оборудования.\n\n"
            "Стоимость:\n14 000 ₽ (1 участник)\n18 000 ₽ (2 участника)\n\n"
            "Подробнее: https://baristaschool.ru/alternative",
            _join_course_cta_markup(),
        ),
        "latteart": (
            "Курс «Латте-арт»\n\n"
            "Индивидуальное обучение для бариста с опытом, которые хотят прокачать технику и уверенно рисовать сложные рисунки.\n"
            "Продолжительность: 3 занятия по 3 часа (9 часов)\n\n"
            "Стоимость:\n24 000 ₽ — для одного участника\n32 000 ₽ — для двоих участников\n\n"
            "Подробнее: https://baristaschool.ru/latte-art",
            _join_course_cta_markup(gift_label="Оформить в подарок"),
        ),
        "expert": (
            "Профессиональный курс бариста\n\n"
            "Подходит для бариста с опытом работы. Это углублённая программа для тех, кто хочет совершенствовать навыки.\n"
            "Продолжительность: 15 часов (5 занятий по 3 часа)\n\n"
            "Стоимость:\n32 000 ₽ — для одного участника\n39 000 ₽ — для двоих участников\n\n"
            "Подробнее: https://baristaschool.ru/expert",
            _join_course_cta_markup(gift_label="Оформить в подарок"),
        ),
    }
    text, markup = cards.get(course, cards["basic"])
    return _join_tg_send(chat_id, text, markup)

def _join_send_cafe_card(chat_id: str | int, card: str) -> dict:
    cards = {
        "open": (
            "Курс «Открытие кофейни» — персональная программа, где вы разберёте путь от выбора локации "
            "и расчёта бюджета до управления персоналом и маркетинга.\n\n"
            "Обучение проходит онлайн, индивидуально, с наставником.\n"
            "Подробнее: https://baristaschool.ru/open_coffeeshop",
            _join_inline_keyboard([
                [("Оставить заявку", "mbs:menu:lead")],
                [("Назад", "mbs:goal:cafe"), ("Главное меню", "mbs:menu:main")],
            ]),
        ),
        "bar": (
            "Мы помогаем выстроить эргономичное пространство и подобрать оборудование под задачи вашего проекта.\n\n"
            "Проектирование барной зоны — от схемы подключения воды и электрики до подбора оптимального оборудования.\n"
            "Подробнее: https://baristaschool.ru/bar_engineering",
            _join_inline_keyboard([
                [("Смотреть пример работы", "https://baristaschool.ru/bar_engineering")],
                [("Оставить заявку", "mbs:menu:lead")],
                [("Назад", "mbs:goal:cafe"), ("Главное меню", "mbs:menu:main")],
            ]),
        ),
        "menu": (
            "Хотите, чтобы меню стало лицом вашей кофейни?\n\n"
            "Мы разрабатываем напитки, которые выделяют заведение — от классики до авторских концепций. "
            "Можно выбрать готовые рецепты, базовое меню или заказать уникальные напитки под ваш проект.\n"
            "Подробнее: https://baristaschool.ru/recipe_busines",
            _join_inline_keyboard([
                [("Оставить заявку", "mbs:menu:lead")],
                [("Назад", "mbs:goal:cafe"), ("Главное меню", "mbs:menu:main")],
            ]),
        ),
    }
    text, markup = cards.get(card, cards["open"])
    return _join_tg_send(chat_id, text, markup)

def _join_handle_menu_action(chat_id: str | int, action: str) -> dict:
    if action == "mbs:menu:main":
        return _join_send_main_menu(chat_id)
    if action == "mbs:menu:courses":
        return _join_send_courses_menu(chat_id)
    if action.startswith("mbs:goal:"):
        return _join_send_goal_menu(chat_id, action.rsplit(":", 1)[-1])
    if action.startswith("mbs:course:"):
        return _join_send_course_card(chat_id, action.rsplit(":", 1)[-1])
    if action.startswith("mbs:cafe:"):
        return _join_send_cafe_card(chat_id, action.rsplit(":", 1)[-1])
    if action == "mbs:menu:events":
        return _join_tg_send(
            chat_id,
            "🎉 События школы\n"
            "Каппинги, мастер-классы, чемпионаты и другие мероприятия Московской школы Бариста.\n\n"
            "Посмотрите расписание и выберите, куда хотите попасть 👇\n"
            "https://baristaschool.ru/#mbs-events-widget",
            _join_inline_keyboard([
                [("Открыть расписание", "https://baristaschool.ru/#mbs-events-widget")],
                [("Главное меню", "mbs:menu:main")],
            ]),
        )
    if action == "mbs:menu:gifts":
        return _join_tg_send(
            chat_id,
            "Сертификат — отличный способ сделать подарок для любителя кофе или будущего бариста.\n\n"
            "Выберите, что вам интересно:",
            _join_inline_keyboard([
                [("📦 Подробнее о сертификатах", "mbs:gifts:info")],
                [("💡 Перейти к выбору", "https://baristaschool.ru/sertifikat")],
                [("Главное меню", "mbs:menu:main")],
            ]),
        )
    if action == "mbs:gifts:info":
        return _join_tg_send(
            chat_id,
            "🎁 О подарочных сертификатах\n\n"
            "Наш сертификат действует 1 год с момента покупки. Вы получите электронный подарочный сертификат.\n\n"
            "При оформлении обязательно указывайте ваши контактные данные — имя, e-mail, телефон.\n"
            "Не указывайте данные того человека, кому вы дарите сертификат. Мы свяжемся именно с вами после покупки, "
            "чтобы оформить красивый именной подарочный сертификат.",
            _join_inline_keyboard([
                [("Выбрать сертификат", "https://baristaschool.ru/sertifikat")],
                [("Оставить заявку", "mbs:menu:lead")],
                [("Главное меню", "mbs:menu:main")],
            ]),
        )
    if action == "mbs:menu:contacts":
        return _join_tg_send(
            chat_id,
            "Наши контакты:\n"
            "🌐 Baristaschool.ru\n"
            "📷 instagram.com/barista_school\n"
            "💬 t.me/moscowbaristaschool\n"
            "📞 +7 995 999 2836\n"
            "Нижняя Красносельская 35 стр.50",
            _join_inline_keyboard([
                [("📍 Построить маршрут", "https://yandex.ru/maps/?text=%D0%9D%D0%B8%D0%B6%D0%BD%D1%8F%D1%8F%20%D0%9A%D1%80%D0%B0%D1%81%D0%BD%D0%BE%D1%81%D0%B5%D0%BB%D1%8C%D1%81%D0%BA%D0%B0%D1%8F%2035%20%D1%81%D1%82%D1%80.50")],
                [("Главное меню", "mbs:menu:main")],
            ]),
        )
    if action == "mbs:menu:question":
        return _join_tg_send(
            chat_id,
            "Напишите ваш вопрос одним сообщением. Менеджер увидит его и ответит в рабочее время.",
            _join_inline_keyboard([[("Главное меню", "mbs:menu:main")]]),
        )
    if action == "mbs:menu:lead":
        return _join_tg_send(
            chat_id,
            "Оставьте, пожалуйста, имя, телефон и что вас интересует одним сообщением. "
            "Менеджер свяжется с вами и поможет с записью.",
            _join_inline_keyboard([[("Главное меню", "mbs:menu:main")]]),
        )
    return _join_send_main_menu(chat_id)

def _join_author_link_url(token: str) -> str:
    payload = urllib.parse.quote(f"author_{token}")
    return f"https://t.me/{JOIN_MBS_BOT_USERNAME}?start={payload}"

def notify_admin_new_user(user_id: int, email: str, name: str, phone: str = "", source: str = "email"):
    """Уведомление в Telegram при новой регистрации."""
    if not TG_TOKEN or not TG_ADMIN_CHAT:
        return
    source_label = "🔑 Email/пароль" if source == "email" else "🟡 Яндекс ID"
    phone_line = f"📱 *Телефон:* {phone}\n" if phone else ""
    admin_url = f"{APP_URL}/?admin=1"
    text = (
        f"🆕 *Новая регистрация*\n\n"
        f"👤 *Имя:* {name}\n"
        f"📧 *Email:* {email}\n"
        f"{phone_line}"
        f"🌐 *Источник:* {source_label}\n\n"
        f"[🔧 Открыть admin-панель]({admin_url})\n\n"
        f"Выдать доступ?"
    )
    _tg_call("sendMessage", {
        "chat_id": TG_ADMIN_CHAT,
        "text": text,
        "parse_mode": "Markdown",
        "reply_markup": {
            "inline_keyboard": [[
                {"text": "✅ Активировать", "callback_data": f"activate_{user_id}"},
                {"text": "❌ Отклонить",    "callback_data": f"reject_{user_id}"},
            ]]
        }
    })

def _tg_escape(value: str) -> str:
    return str(value or "").replace("`", "'").replace("*", "")

def _format_tg_date(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    try:
        return datetime.fromisoformat(raw[:10]).strftime("%d.%m.%Y")
    except Exception:
        return raw[:10]

def _format_author_participations_for_tg(items: list) -> str:
    lines = []
    for item in items or []:
        title = _tg_escape(item.get("event_title") or "MBS MIXOLOGY CUP")
        dates = [_format_tg_date(v) for v in item.get("dates") or [] if v]
        date_text = ", ".join([d for d in dates if d]) or "дата не указана"
        lines.append(f"• {title}: {date_text}")
    return "\n".join(lines)

def notify_admin_mixology_author(user_id: int):
    """Уведомить команду об автоматической авторской активации Mixology Cup."""
    if not TG_TOKEN or not TG_ADMIN_CHAT:
        return
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
    finally:
        db.close()
    admin_url = f"{APP_URL}/?admin=1"
    if not user:
        text = (
            "🍸 *Автор Mixology Cup активирован автоматически*\n\n"
            f"Пользователь #{user_id} получил доступ `Автор рецептов`.\n"
            f"[🔧 Открыть admin-панель]({admin_url})"
        )
    else:
        import sqlite3 as _sq
        con = _sq.connect(app_db_path())
        try:
            participations = _author_championship_participations(con, user.id)
        finally:
            con.close()
        participation_text = _format_author_participations_for_tg(participations)
        phone = _tg_escape(user.phone or "не указан")
        name = _tg_escape(user.name or "без имени")
        email = _tg_escape(user.email or "не указан")
        details = (
            f"👤 *Автор:* {name}\n"
            f"📧 *Email:* `{email}`\n"
            f"📱 *Телефон:* `{phone}`\n"
            f"🆔 *ID в платформе:* #{user.id}\n"
        )
        if participation_text:
            details += f"\n🏆 *Участие:*\n{participation_text}\n"
        text = (
            "🍸 *Автор Mixology Cup активирован автоматически*\n\n"
            f"{details}\n"
            "Доступ `Автор рецептов` выдан по совпадению телефона с участником чемпионата.\n"
            f"[🔧 Открыть admin-панель]({admin_url})"
        )
    _tg_call("sendMessage", {
        "chat_id": TG_ADMIN_CHAT,
        "text": text,
        "parse_mode": "Markdown",
    })

def send_password_reset_email(to_email: str, reset_url: str, name: str, login_url: str = "") -> bool:
    """Отправить ссылку для безопасного сброса пароля."""
    display_name = name if name and name.strip() and name.strip().lower() != to_email.lower() else to_email
    link_url = reset_url or login_url or APP_URL
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;background:#f4f4f4">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;margin:24px auto;max-width:480px">
        <div style="background:#417033;padding:28px 32px 24px">
          <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.01em">☕ Moscow Barista School</div>
          <div style="font-size:13px;color:#c8e6c0;margin-top:4px">barista-school.online</div>
        </div>
        <div style="padding:32px 32px 24px">
          <p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 8px">Привет, {display_name}!</p>
          <p style="color:#555;font-size:14px;margin:0 0 24px;line-height:1.6">Мы получили запрос на сброс пароля для вашего аккаунта. Нажмите кнопку ниже и задайте новый пароль.</p>
          <a href="{link_url}" style="display:block;background:#417033;color:#ffffff;text-align:center;text-decoration:none;font-size:16px;font-weight:800;padding:15px 22px;border-radius:12px;font-family:Arial,sans-serif;margin:0 0 20px">Сбросить пароль</a>
          <p style="color:#777;font-size:13px;margin:0 0 8px;line-height:1.6">Ссылка действует 24 часа. Старый пароль останется активным, пока вы не зададите новый.</p>
          <p style="color:#999;font-size:13px;margin:0;line-height:1.6">Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
        </div>
        <div style="border-top:1px solid #f0f0f0;padding:20px 32px;background:#fafafa">
          <p style="color:#999;font-size:12px;margin:0 0 14px">Это письмо сформировано автоматически — отвечать на него не нужно.</p>
          <a href="https://t.me/Moscow_barista_school" style="display:inline-block;background:#417033;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;font-family:Arial,sans-serif">✈️ Написать в Telegram</a>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, "Сброс пароля — Moscow Barista School", html)

def send_workspace_invite_email(to_email: str, inviter_name: str, workspace_name: str, invite_url: str) -> bool:
    safe_inviter = (inviter_name or "Владелец проекта").replace("<", "").replace(">", "")
    safe_workspace = (workspace_name or "проект кофейни").replace("<", "").replace(">", "")
    html = f"""
    <div style="font-family:Arial,sans-serif;line-height:1.55;color:#1f2937">
      <h2 style="margin:0 0 12px">Приглашение в проект кофейни</h2>
      <p>{safe_inviter} приглашает вас в общий проект «{safe_workspace}» на платформе Moscow Barista School.</p>
      <p><a href="{invite_url}" style="display:inline-block;background:#417033;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700">Открыть приглашение</a></p>
      <p style="font-size:13px;color:#6b7280">Если кнопка не открывается, скопируйте ссылку: {invite_url}</p>
    </div>
    """
    return _send_email(to_email, "Приглашение в проект кофейни — Moscow Barista School", html)

def _send_email(to_email: str, subject: str, html: str) -> bool:
    """Базовая отправка email."""
    if not SMTP_HOST or not SMTP_USER:
        return False
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"Moscow Barista School <{SMTP_USER}>"
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    try:
        import ssl as _ssl
        ctx = _ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10, context=ctx) as s:
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"[email] error sending to {to_email}: {e}")
        return False

def send_activation_email(to_email: str, name: str) -> bool:
    """Письмо пользователю — аккаунт активирован."""
    display = name if name and name.strip() and name.strip().lower() != to_email.lower() else to_email
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f4f4f4;padding:24px 0">
      <div style="background:#fff;border-radius:16px;overflow:hidden;max-width:480px;margin:0 auto">
        <div style="background:#417033;padding:28px 32px 24px">
          <div style="font-size:22px;font-weight:800;color:#fff">☕ Moscow Barista School</div>
          <div style="font-size:13px;color:#c8e6c0;margin-top:4px">barista-school.online</div>
        </div>
        <div style="padding:32px 32px 24px">
          <p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 12px">Привет, {display}! 🎉</p>
          <p style="color:#555;font-size:14px;margin:0 0 24px;line-height:1.6">
            Ваш аккаунт <strong>активирован</strong>. Теперь вы можете войти и пользоваться всеми инструментами.
          </p>
          <a href="https://barista-school.online" style="display:inline-block;background:#417033;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px">Войти в сервис →</a>
        </div>
        <div style="border-top:1px solid #f0f0f0;padding:20px 32px;background:#fafafa">
          <p style="color:#999;font-size:12px;margin:0">Это письмо сформировано автоматически.</p>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, "Ваш аккаунт активирован — Moscow Barista School", html)

def send_rejection_email(to_email: str, name: str) -> bool:
    """Письмо пользователю — заявка отклонена."""
    display = name if name and name.strip() and name.strip().lower() != to_email.lower() else to_email
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f4f4f4;padding:24px 0">
      <div style="background:#fff;border-radius:16px;overflow:hidden;max-width:480px;margin:0 auto">
        <div style="background:#417033;padding:28px 32px 24px">
          <div style="font-size:22px;font-weight:800;color:#fff">☕ Moscow Barista School</div>
          <div style="font-size:13px;color:#c8e6c0;margin-top:4px">barista-school.online</div>
        </div>
        <div style="padding:32px 32px 24px">
          <p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 12px">Здравствуйте, {display}</p>
          <p style="color:#555;font-size:14px;margin:0 0 16px;line-height:1.6">
            К сожалению, ваша заявка на доступ к сервису была <strong>отклонена</strong>.
          </p>
          <p style="color:#555;font-size:14px;margin:0 0 24px;line-height:1.6">
            Если вы считаете это ошибкой — напишите нам в Telegram.
          </p>
          <a href="https://t.me/Moscow_barista_school" style="display:inline-block;background:#417033;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px">✈️ Написать в Telegram</a>
        </div>
        <div style="border-top:1px solid #f0f0f0;padding:20px 32px;background:#fafafa">
          <p style="color:#999;font-size:12px;margin:0">Это письмо сформировано автоматически.</p>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, "Заявка на доступ отклонена — Moscow Barista School", html)

def send_deletion_email(to_email: str, name: str) -> bool:
    """Письмо пользователю — аккаунт удалён."""
    display = name if name and name.strip() and name.strip().lower() != to_email.lower() else to_email
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f4f4f4;padding:24px 0">
      <div style="background:#fff;border-radius:16px;overflow:hidden;max-width:480px;margin:0 auto">
        <div style="background:#417033;padding:28px 32px 24px">
          <div style="font-size:22px;font-weight:800;color:#fff">☕ Moscow Barista School</div>
          <div style="font-size:13px;color:#c8e6c0;margin-top:4px">barista-school.online</div>
        </div>
        <div style="padding:32px 32px 24px">
          <p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 12px">Здравствуйте, {display}</p>
          <p style="color:#555;font-size:14px;margin:0 0 24px;line-height:1.6">
            Ваш аккаунт в сервисе Moscow Barista School был <strong>удалён</strong>.
            Все связанные данные также удалены.
          </p>
          <p style="color:#555;font-size:14px;margin:0;line-height:1.6">
            Если вы считаете это ошибкой — напишите нам в Telegram.
          </p>
        </div>
        <div style="border-top:1px solid #f0f0f0;padding:20px 32px;background:#fafafa">
          <a href="https://t.me/Moscow_barista_school" style="display:inline-block;background:#417033;color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px">✈️ Написать в Telegram</a>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, "Ваш аккаунт удалён — Moscow Barista School", html)

def _register_tg_webhook():
    """Регистрирует Telegram webhook при старте сервера."""
    if not TG_TOKEN:
        return
    webhook_url = f"{APP_URL}/api/telegram/webhook"
    try:
        data = json.dumps({
            "url": webhook_url,
            "allowed_updates": ["callback_query", "message"]
        }).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TG_TOKEN}/setWebhook",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read())
            print(f"[telegram] webhook registered: {result}")
    except Exception as e:
        print(f"[telegram] webhook registration failed: {e}")

# ── Telegram long polling (fallback если webhook не работает) ──
_tg_poll_offset = 0
_tg_poll_running = False

def _process_tg_update(update: dict):
    """Обрабатывает одно обновление от Telegram (callback_query)."""
    cb = update.get("callback_query")
    if not cb:
        return

    cb_id   = cb.get("id")
    chat_id = cb.get("from", {}).get("id")
    payload = cb.get("data", "")
    msg_id  = cb.get("message", {}).get("message_id")

    _tg_call("answerCallbackQuery", {"callback_query_id": cb_id})

    if "_" not in payload:
        return

    action, uid_str = payload.split("_", 1)
    try:
        uid = int(uid_str)
    except ValueError:
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == uid).first()
        if not user:
            _tg_call("sendMessage", {"chat_id": chat_id, "text": f"⚠️ Пользователь #{uid} не найден"})
            return

        if action == "activate":
            was_inactive = not user.is_active
            user.is_active = True
            db.commit()
            if was_inactive:
                send_activation_email(user.email, user.name)
            reply = f"✅ *{user.name}* (`{user.email}`) активирован — письмо отправлено"
        elif action == "reject":
            user.is_active = False
            db.commit()
            send_rejection_email(user.email, user.name)
            reply = f"❌ *{user.name}* (`{user.email}`) отклонён — письмо отправлено"
        else:
            return

        if msg_id and TG_ADMIN_CHAT:
            _tg_call("editMessageText", {
                "chat_id": TG_ADMIN_CHAT,
                "message_id": msg_id,
                "text": reply,
                "parse_mode": "Markdown",
            })
    finally:
        db.close()

def _tg_poll_loop():
    """Фоновый поток: long polling Telegram каждые 2 секунды."""
    global _tg_poll_offset
    if not TG_TOKEN:
        return
    print("[telegram] long polling started")
    while _tg_poll_running:
        try:
            data = json.dumps({
                "offset": _tg_poll_offset,
                "timeout": 20,
                "allowed_updates": ["callback_query", "message"]
            }).encode()
            req = urllib.request.Request(
                f"https://api.telegram.org/bot{TG_TOKEN}/getUpdates",
                data=data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=25) as r:
                result = json.loads(r.read())
            for upd in result.get("result", []):
                _tg_poll_offset = upd["update_id"] + 1
                try:
                    _process_tg_update(upd)
                except Exception as e:
                    print(f"[telegram] update processing error: {e}")
        except Exception as e:
            print(f"[telegram] polling error: {e}")
            time.sleep(5)  # пауза при ошибке

# ── Pydantic схемы ────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    name: str = ""
    password: str
    phone: str = ""
    consent: bool = False
    invite_token: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

class StatePayload(BaseModel):
    state: dict
    workspace_id: Optional[int] = None

class WorkspaceCreatePayload(BaseModel):
    name: str = ""

class WorkspaceUpdatePayload(BaseModel):
    name: str = ""

class WorkspaceInvitePayload(BaseModel):
    email: str

class WorkspaceActivityPayload(BaseModel):
    action: str
    target_type: str = ""
    target_id: str = ""
    summary: str = ""
    metadata: dict = {}

class WorkspaceSnapshotPayload(BaseModel):
    reason: str = "manual"

class ForgotPasswordRequest(BaseModel):
    email: str
    source: str = "user"  # 'user' или 'admin'

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

class AccountProfilePayload(BaseModel):
    name: str = ""
    phone: str = ""

class OAuthExchangeRequest(BaseModel):
    code: str = ""

class AuthorProfilePayload(BaseModel):
    full_name: str = ""
    public_name: str = ""
    first_name: str = ""
    last_name: str = ""
    patronymic: str = ""
    phone: str = ""
    email: str = ""
    telegram: Optional[str] = None
    bio: str = ""
    document_status: str = "not_started"
    bitrix_contact_id: str = ""
    mixology_participant_id: str = ""

class RecipePublicationPayload(BaseModel):
    recipe_local_id: str = ""
    title: str
    group_name: str = ""
    volume_ml: int = 0
    price: float = 0.0
    cost: float = 0.0
    recipe: dict = {}
    public_description: str = ""
    image_url: str = ""
    video_url: str = ""

class AuthorDraftPayload(BaseModel):
    title: str = ""
    group_name: str = ""
    volume_ml: int = 0
    price: float = 0.0
    draft: dict = {}

class AuthorIngredientPayload(BaseModel):
    key: str = ""
    ingredient: dict = {}
    supplier: dict = {}

class AuthorSemiPayload(BaseModel):
    semi: dict = {}

class AdminPublicationPatch(BaseModel):
    status: Optional[str] = None
    review_comment: str = ""
    review_flags: Optional[List[str]] = None
    public_description: Optional[str] = None
    price: Optional[float] = None
    bitrix_product_name: Optional[str] = None

class RecipeOrderPayload(BaseModel):
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    comment: str = ""
    source: str = "barista-school.online"

class RecipeCartOrderPayload(RecipeOrderPayload):
    recipe_ids: List[int] = []

class AuthorTelegramSettingsPayload(BaseModel):
    notify_enabled: bool = True

# ── FastAPI ───────────────────────────────────────────────────
app = FastAPI(title="Coffee Menu API")
app.mount("/api/uploads", StaticFiles(directory=PUBLIC_UPLOAD_DIR), name="public_uploads")

@app.on_event("startup")
def on_startup():
    global _tg_poll_running
    _tg_poll_running = True
    t = threading.Thread(target=_tg_poll_loop, daemon=True)
    t.start()

@app.on_event("shutdown")
def on_shutdown():
    global _tg_poll_running
    _tg_poll_running = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://barista-school.online",
        "http://barista-school.online",
        "https://baristaschool.online",
        "http://baristaschool.online",
        "https://baristaschool.ru",
        "http://baristaschool.ru",
        "https://www.baristaschool.ru",
        "http://www.baristaschool.ru",
        "http://localhost:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── AUTH ──────────────────────────────────────────────────────
@app.post("/api/auth/register")
def register(body: RegisterRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = body.email.lower().strip()
    invite_token = (body.invite_token or "").strip()
    invite_row = None
    if invite_token:
        con = _workspace_con()
        try:
            invite_row = _pending_invite_for_token(con, invite_token, email)
        finally:
            con.close()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email уже зарегистрирован")
    phone = normalize_phone_digits(body.phone)
    mixology_match = _mixology_author_match(phone)
    user = User(
        email=email,
        name=body.name or email.split("@")[0],
        password_hash=hash_password(body.password),
        is_active=bool(mixology_match or invite_row),
        is_admin=(email == ADMIN_EMAIL.lower()),
        consent=body.consent,
        consent_at=datetime.utcnow() if body.consent else None,
        phone=body.phone.strip() if body.phone else None,
        reg_source="invite" if invite_row else "email",
        access_author=bool(mixology_match),
    )
    # Первый зарегистрированный admin — активен сразу
    if user.is_admin:
        user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
    if invite_row:
        con = _workspace_con()
        try:
            invite_row = _pending_invite_for_token(con, invite_token, email)
            workspace, role = _accept_workspace_invite_for_user(con, invite_row, user)
            con.commit()
            token = create_token(user.id)
            return {
                "ok": True,
                "pending": False,
                "token": token,
                "user": user_public_payload(user),
                "workspace": _workspace_payload(workspace, role, user),
                "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
                "message": "Приглашение принято",
            }
        finally:
            con.close()
    if mixology_match:
        import sqlite3 as _sq
        con = _sq.connect(app_db_path())
        try:
            _ensure_author_profile_for_user(con, user, status="pending")
            _sync_author_championship_participations(con, user, mixology_match)
            con.execute(
                "UPDATE author_profiles SET mixology_participant_id=?,updated_at=? WHERE user_id=?",
                (mixology_match.get("yclients_id") or "", utc_now_iso(), user.id),
            )
            con.commit()
        finally:
            con.close()
        _queue_author_bitrix_sync(user.id, background_tasks)
        notify_admin_mixology_author(user.id)
        token = create_token(user.id)
        return {
            "ok": True,
            "pending": False,
            "token": token,
            "user": user_public_payload(user),
            "auto_author": True,
            "message": "Доступ автора Mixology Cup выдан автоматически",
        }
    # Уведомить admin в Telegram (только для неактивных — не для самого admin)
    if not user.is_active:
        notify_admin_new_user(user.id, user.email, user.name, phone=user.phone or "", source="email")
    return {"ok": True, "pending": not user.is_active, "message": "Ожидайте активации аккаунта" if not user.is_active else "Добро пожаловать!"}

@app.post("/api/auth/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт ожидает активации администратором")
    user.last_login_at = datetime.utcnow()
    db.commit()
    token = create_token(user.id)
    return {"ok": True, "token": token, "user": user_public_payload(user)}

@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return user_public_payload(user)

# ── ACCOUNT PROFILE ──────────────────────────────────────────
@app.patch("/api/account/profile")
def update_account_profile(
    body: AccountProfilePayload,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = (body.name or "").strip()
    phone = (body.phone or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Введите имя")
    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    db_user.name = name
    db_user.phone = phone or None
    db_user.bitrix_sync_status = "pending"
    db_user.bitrix_sync_error = ""
    db.commit()
    db.refresh(db_user)
    _queue_account_bitrix_sync(db_user.id, background_tasks)
    return {"ok": True, "user": user_public_payload(db_user)}

@app.post("/api/account/avatar")
def upload_account_avatar(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    content_type = (file.content_type or "").lower()
    ext = allowed.get(content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Можно загрузить только JPG, PNG или WebP")
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Файл пустой")
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Фото должно быть не больше 5 МБ")
    safe_name = f"{public_upload_owner_token(user.id)}-{int(time.time())}-{secrets.token_hex(4)}.{ext}"
    path = os.path.join(ACCOUNT_AVATAR_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(data)
    avatar_url = f"/api/uploads/accounts/{safe_name}"
    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    db_user.avatar_url = avatar_url
    db_user.bitrix_sync_status = "pending"
    db_user.bitrix_sync_error = ""
    db.commit()
    db.refresh(db_user)
    _queue_account_bitrix_sync(db_user.id, background_tasks)
    return {"ok": True, "avatar_url": avatar_url, "user": user_public_payload(db_user)}

@app.post("/api/account/password-reset")
def request_account_password_reset(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user or not db_user.is_active:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    token = secrets.token_urlsafe(32)
    db_user.reset_token = token
    db_user.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.commit()
    reset_url = f"{APP_URL}/?reset_token={urllib.parse.quote(token)}"
    email_sent = send_password_reset_email(db_user.email, reset_url, db_user.name, APP_URL)
    return {"ok": True, "email_sent": bool(email_sent)}

# ── STATE ─────────────────────────────────────────────────────
@app.get("/api/state")
def get_state(workspace_id: int = 0, user: User = Depends(get_current_user)):
    if not workspace_id:
        current = _ensure_user_workspace(user)
        if not current:
            return {
                "state": {},
                "workspace": None,
                "workspaces": [],
                "can_create_workspaces": can_create_workspaces(user),
            }
        workspace_id = current["id"]
    con = _workspace_con()
    try:
        row, role = _require_workspace(con, workspace_id, user)
        _log_project_opened_throttled(con, workspace_id, user)
        con.commit()
        return {
            "state": _json_loads_safe(row["state_json"], {}),
            "workspace": _workspace_payload(row, role, user),
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.put("/api/state")
def save_state(body: StatePayload, user: User = Depends(get_current_user)):
    workspace_id = int(body.workspace_id or 0)
    if not workspace_id:
        current = _ensure_user_workspace(user)
        if not current:
            raise HTTPException(status_code=403, detail="Нет доступного проекта")
        workspace_id = current["id"]
    con = _workspace_con()
    try:
        state_str = json.dumps(body.state, ensure_ascii=False)
        workspace, role = _require_workspace(con, workspace_id, user)
        _require_safe_workspace_state_update(con, workspace, role, user, body.state)
        _maybe_auto_workspace_snapshot(con, workspace, user, state_str)
        con.execute(
            "UPDATE workspaces SET state_json=?,updated_at=? WHERE id=?",
            (state_str, utc_now_iso(), workspace_id),
        )
        con.commit()
        return {"ok": True, "workspace_id": workspace_id}
    finally:
        con.close()

@app.get("/api/workspaces")
def list_workspaces(user: User = Depends(get_current_user)):
    _ensure_user_workspace(user)
    con = _workspace_con()
    try:
        return {
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.post("/api/workspaces")
def create_workspace(body: WorkspaceCreatePayload, user: User = Depends(get_current_user)):
    if not can_create_workspaces(user):
        raise HTTPException(status_code=403, detail="Свои проекты доступны на платном тарифе")
    name = (body.name or "").strip() or "Новый проект кофейни"
    con = _workspace_con()
    try:
        now = utc_now_iso()
        cur = con.execute(
            "INSERT INTO workspaces (name,owner_user_id,state_json,created_at,updated_at) VALUES (?,?,?,?,?)",
            (name[:120], user.id, "{}", now, now),
        )
        workspace_id = int(cur.lastrowid)
        con.execute(
            "INSERT INTO workspace_members (workspace_id,user_id,role,created_at) VALUES (?,?,?,?)",
            (workspace_id, user.id, "owner", now),
        )
        _log_workspace_activity(con, workspace_id, user, "workspace_created", "workspace", str(workspace_id), f"Создан проект «{name[:120]}»")
        con.commit()
        row = con.execute("SELECT * FROM workspaces WHERE id=?", (workspace_id,)).fetchone()
        return {
            "ok": True,
            "workspace": _workspace_payload(row, "owner", user),
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()


@app.post("/api/workspaces/{workspace_id}/archive")
def archive_workspace(workspace_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        workspace, _role = _require_workspace(con, workspace_id, user, owner_required=True)
        active_owned = con.execute(
            """
            SELECT COUNT(*) AS cnt
            FROM workspaces w
            JOIN workspace_members m ON m.workspace_id=w.id
            WHERE m.user_id=? AND m.role='owner' AND w.id!=?
              AND COALESCE(w.archived_at,'')='' AND COALESCE(w.deleted_at,'')=''
            """,
            (user.id, workspace_id),
        ).fetchone()
        if int(active_owned["cnt"] or 0) < 1:
            raise HTTPException(status_code=400, detail="Нельзя архивировать последний активный проект")
        now = utc_now_iso()
        _create_workspace_snapshot(con, workspace, user, "before_workspace_archive")
        con.execute("UPDATE workspaces SET archived_at=?,updated_at=? WHERE id=?", (now, now, workspace_id))
        _log_workspace_activity(con, workspace_id, user, "workspace_archived", "workspace", str(workspace_id), f"Проект архивирован: «{workspace['name'] or 'Моя кофейня'}»")
        con.commit()
        return {
            "ok": True,
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.post("/api/workspaces/{workspace_id}/restore")
def restore_workspace(workspace_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        workspace, _role = _require_workspace_including_archived(con, workspace_id, user, owner_required=True)
        if not (workspace["archived_at"] or ""):
            raise HTTPException(status_code=400, detail="Проект не находится в архиве")
        now = utc_now_iso()
        con.execute("UPDATE workspaces SET archived_at='',updated_at=? WHERE id=?", (now, workspace_id))
        _log_workspace_activity(con, workspace_id, user, "workspace_restored", "workspace", str(workspace_id), f"Проект восстановлен из архива: «{workspace['name'] or 'Моя кофейня'}»")
        con.commit()
        row = con.execute("SELECT * FROM workspaces WHERE id=?", (workspace_id,)).fetchone()
        return {
            "ok": True,
            "workspace": _workspace_payload(row, "owner", user),
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.delete("/api/workspaces/{workspace_id}")
def delete_workspace(workspace_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        workspace, _role = _require_workspace(con, workspace_id, user, owner_required=True)
        now = utc_now_iso()
        _create_workspace_snapshot(con, workspace, user, "before_workspace_delete")
        con.execute("UPDATE workspaces SET deleted_at=?,updated_at=? WHERE id=?", (now, now, workspace_id))
        _log_workspace_activity(con, workspace_id, user, "workspace_deleted", "workspace", str(workspace_id), f"Проект удалён: «{workspace['name'] or 'Моя кофейня'}»")
        con.commit()
        return {
            "ok": True,
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.patch("/api/workspaces/{workspace_id}")
def update_workspace(workspace_id: int, body: WorkspaceUpdatePayload, user: User = Depends(get_current_user)):
    name = (body.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Введите название проекта")
    con = _workspace_con()
    try:
        workspace, role = _require_workspace(con, workspace_id, user, owner_required=True)
        old_name = workspace["name"] or "Моя кофейня"
        new_name = name[:120]
        now = utc_now_iso()
        con.execute("UPDATE workspaces SET name=?,updated_at=? WHERE id=?", (new_name, now, workspace_id))
        _log_workspace_activity(
            con,
            workspace_id,
            user,
            "workspace_renamed",
            "workspace",
            str(workspace_id),
            f"Проект переименован: «{old_name}» → «{new_name}»",
        )
        con.commit()
        row = con.execute("SELECT * FROM workspaces WHERE id=?", (workspace_id,)).fetchone()
        return {
            "ok": True,
            "workspace": _workspace_payload(row, role, user),
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.get("/api/workspaces/{workspace_id}/members")
def workspace_members(workspace_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        _workspace, member_role = _require_workspace(con, workspace_id, user)
        _dedupe_pending_workspace_invites(con, workspace_id)
        con.commit()
        members = con.execute(
            """
            SELECT m.workspace_id,m.user_id,m.role,m.created_at,u.email,u.name,u.avatar_url,
                   u.is_admin,u.access_drinks,u.access_finance
            FROM workspace_members m
            JOIN users u ON u.id=m.user_id
            WHERE m.workspace_id=?
            ORDER BY CASE WHEN m.role='owner' THEN 0 ELSE 1 END, u.name COLLATE NOCASE
            """,
            (workspace_id,),
        ).fetchall()
        invites = con.execute(
            """
            SELECT id,email,token,role,status,created_at,accepted_at,revoked_at
            FROM workspace_invites i
            WHERE i.workspace_id=? AND i.status='pending'
              AND NOT EXISTS (
                  SELECT 1
                  FROM workspace_members m
                  JOIN users u ON u.id=m.user_id
                  WHERE m.workspace_id=i.workspace_id AND lower(u.email)=lower(i.email)
              )
            ORDER BY id DESC
            """,
            (workspace_id,),
        ).fetchall()
        return {
            "members": [
                {
                    **dict(r),
                    "can_create_workspaces": bool(r["is_admin"] or r["access_drinks"] or r["access_finance"]),
                    "account_role": "owner" if r["role"] == "owner" else ("paid" if (r["is_admin"] or r["access_drinks"] or r["access_finance"]) else "guest"),
                }
                for r in members
            ],
            "invites": [
                {
                    **{k: v for k, v in dict(r).items() if k != "token"},
                    **({"invite_link": _workspace_invite_link(r["token"])} if member_role == "owner" else {}),
                }
                for r in invites
            ],
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.post("/api/workspaces/{workspace_id}/invites")
def create_workspace_invite(workspace_id: int, body: WorkspaceInvitePayload, user: User = Depends(get_current_user)):
    email = (body.email or "").strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Введите email участника")
    con = _workspace_con()
    try:
        workspace, _role = _require_workspace(con, workspace_id, user, owner_required=True)
        _dedupe_pending_workspace_invites(con, workspace_id)
        existing_member = con.execute(
            """
            SELECT u.email
            FROM workspace_members m
            JOIN users u ON u.id=m.user_id
            WHERE m.workspace_id=? AND lower(u.email)=lower(?)
            LIMIT 1
            """,
            (workspace_id, email),
        ).fetchone()
        if existing_member:
            raise HTTPException(status_code=409, detail="Этот пользователь уже состоит в проекте")
        existing_invite = con.execute(
            """
            SELECT id,email,token
            FROM workspace_invites
            WHERE workspace_id=? AND lower(email)=lower(?) AND status='pending'
            ORDER BY id DESC
            LIMIT 1
            """,
            (workspace_id, email),
        ).fetchone()
        if existing_invite:
            con.commit()
            return {
                "ok": True,
                "invite_link": _workspace_invite_link(existing_invite["token"]),
                "email_sent": False,
                "already_pending": True,
            }
        token = secrets.token_urlsafe(32)
        now = utc_now_iso()
        con.execute(
            """
            INSERT INTO workspace_invites (workspace_id,email,token,role,status,invited_by_user_id,created_at)
            VALUES (?,?,?,?,?,?,?)
            """,
            (workspace_id, email, token, "editor", "pending", user.id, now),
        )
        link = _workspace_invite_link(token)
        email_sent = send_workspace_invite_email(email, user.name or user.email, workspace["name"], link)
        _log_workspace_activity(con, workspace_id, user, "invite_created", "member", email, f"Приглашён участник {email}", {"email_sent": email_sent})
        con.commit()
        return {"ok": True, "invite_link": link, "email_sent": email_sent}
    finally:
        con.close()

@app.delete("/api/workspaces/{workspace_id}/invites/{invite_id}")
def revoke_workspace_invite(workspace_id: int, invite_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        _require_workspace(con, workspace_id, user, owner_required=True)
        row = con.execute("SELECT * FROM workspace_invites WHERE id=? AND workspace_id=?", (invite_id, workspace_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Приглашение не найдено")
        con.execute("UPDATE workspace_invites SET status='revoked',revoked_at=? WHERE id=?", (utc_now_iso(), invite_id))
        _log_workspace_activity(con, workspace_id, user, "invite_revoked", "member", row["email"], f"Отозвано приглашение {row['email']}")
        con.commit()
        return {"ok": True}
    finally:
        con.close()

@app.post("/api/workspace-invites/{token}/accept")
def accept_workspace_invite(token: str, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        row = _pending_invite_for_token(con, token, user.email)
        workspace, role = _accept_workspace_invite_for_user(con, row, user)
        con.commit()
        return {
            "ok": True,
            "workspace": _workspace_payload(workspace, role, user),
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

@app.delete("/api/workspaces/{workspace_id}/members/{member_user_id}")
def remove_workspace_member(workspace_id: int, member_user_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        workspace, _role = _require_workspace(con, workspace_id, user, owner_required=True)
        if int(workspace["owner_user_id"]) == int(member_user_id):
            raise HTTPException(status_code=400, detail="Нельзя удалить владельца проекта")
        member = con.execute(
            """
            SELECT u.email,u.name,m.role
            FROM workspace_members m JOIN users u ON u.id=m.user_id
            WHERE m.workspace_id=? AND m.user_id=?
            """,
            (workspace_id, member_user_id),
        ).fetchone()
        if not member:
            raise HTTPException(status_code=404, detail="Участник не найден")
        con.execute("DELETE FROM workspace_members WHERE workspace_id=? AND user_id=?", (workspace_id, member_user_id))
        _log_workspace_activity(con, workspace_id, user, "member_removed", "member", str(member_user_id), f"Удалён участник {member['email']}")
        con.commit()
        return {"ok": True}
    finally:
        con.close()

@app.get("/api/workspaces/{workspace_id}/activity")
def workspace_activity(workspace_id: int, limit: int = 80, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        _require_workspace(con, workspace_id, user)
        safe_limit = max(1, min(int(limit or 80), 200))
        rows = con.execute(
            """
            SELECT a.id,a.actor_user_id,a.actor_name,u.avatar_url AS actor_avatar_url,
                   a.action,a.target_type,a.target_id,a.summary,a.metadata_json,a.created_at,
                   m.role AS actor_workspace_role,
                   u.is_admin AS actor_is_admin,
                   u.access_drinks AS actor_access_drinks,
                   u.access_finance AS actor_access_finance
            FROM workspace_activity a
            LEFT JOIN users u ON u.id=a.actor_user_id
            LEFT JOIN workspace_members m ON m.workspace_id=a.workspace_id AND m.user_id=a.actor_user_id
            WHERE a.workspace_id=?
            ORDER BY a.id DESC
            LIMIT ?
            """,
            (workspace_id, safe_limit),
        ).fetchall()
        activity = []
        for r in rows:
            item = dict(r)
            role = item.get("actor_workspace_role") or ""
            item["actor_role"] = role
            item["actor_account_role"] = "owner" if role == "owner" else (
                "paid" if (item.get("actor_is_admin") or item.get("actor_access_drinks") or item.get("actor_access_finance")) else "guest"
            )
            for key in ("actor_workspace_role", "actor_is_admin", "actor_access_drinks", "actor_access_finance"):
                item.pop(key, None)
            activity.append(item)
        return {"activity": activity}
    finally:
        con.close()

@app.post("/api/workspaces/{workspace_id}/activity")
def create_workspace_activity(workspace_id: int, body: WorkspaceActivityPayload, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        _, role = _require_workspace(con, workspace_id, user)
        action = str(body.action or "").strip()
        if action not in WORKSPACE_ACTIVITY_ACTIONS:
            raise HTTPException(status_code=400, detail="Неизвестный тип события журнала")
        _require_workspace_owner_activity(user, role, action)
        _log_workspace_activity(con, workspace_id, user, body.action, body.target_type, body.target_id, body.summary, body.metadata)
        con.commit()
        return {"ok": True}
    finally:
        con.close()

@app.post("/api/workspaces/{workspace_id}/files")
def upload_workspace_file(
    workspace_id: int,
    note_id: str = "",
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    con = _workspace_con()
    try:
        _workspace, _role = _require_workspace(con, workspace_id, user)
        content_type = (file.content_type or "").lower().split(";")[0].strip()
        ext = WORKSPACE_FILE_TYPES.get(content_type)
        guessed = mimetypes.guess_type(file.filename or "")[0] or ""
        if not ext and guessed:
            content_type = guessed.lower()
            ext = WORKSPACE_FILE_TYPES.get(content_type)
        original_ext = os.path.splitext(file.filename or "")[1].lower().lstrip(".")
        if not ext and original_ext in WORKSPACE_FILE_EXTENSIONS:
            content_type, ext = WORKSPACE_FILE_EXTENSIONS[original_ext]
        if not ext:
            raise HTTPException(status_code=400, detail="Можно загрузить PDF, DOCX, XLSX, CSV, TXT, PNG, JPG или WebP")
        data = file.file.read()
        if not data:
            raise HTTPException(status_code=400, detail="Файл пустой")
        if len(data) > WORKSPACE_FILE_MAX_BYTES:
            raise HTTPException(status_code=400, detail="Файл должен быть не больше 10 МБ")
        workspace_dir = os.path.join(WORKSPACE_UPLOAD_DIR, str(int(workspace_id)))
        os.makedirs(workspace_dir, exist_ok=True)
        original_name = _safe_workspace_filename(file.filename or f"file.{ext}", ext)
        stored_name = f"{int(time.time())}-{secrets.token_hex(8)}.{ext}"
        path = os.path.join(workspace_dir, stored_name)
        with open(path, "wb") as f:
            f.write(data)
        now = utc_now_iso()
        cur = con.execute(
            """
            INSERT INTO workspace_files
                (workspace_id,note_id,uploader_user_id,original_name,stored_name,content_type,size_bytes,created_at)
            VALUES (?,?,?,?,?,?,?,?)
            """,
            (workspace_id, str(note_id or "")[:120], user.id, original_name, stored_name, content_type, len(data), now),
        )
        file_id = int(cur.lastrowid)
        row = con.execute("SELECT * FROM workspace_files WHERE id=? AND workspace_id=?", (file_id, workspace_id)).fetchone()
        _log_workspace_activity(
            con,
            workspace_id,
            user,
            "workspace_file_uploaded",
            "workspace_file",
            str(file_id),
            f"Прикреплён файл «{original_name}»",
            {"note_id": str(note_id or "")[:120], "size": len(data), "content_type": content_type},
        )
        con.commit()
        return {"ok": True, "file": _workspace_file_payload(row, workspace_id)}
    finally:
        con.close()

@app.get("/api/workspaces/{workspace_id}/files/{file_id}")
def download_workspace_file(workspace_id: int, file_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        _require_workspace(con, workspace_id, user)
        row = con.execute("SELECT * FROM workspace_files WHERE id=? AND workspace_id=?", (file_id, workspace_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Файл не найден")
        path = os.path.join(WORKSPACE_UPLOAD_DIR, str(int(workspace_id)), row["stored_name"] or "")
        if not os.path.exists(path):
            raise HTTPException(status_code=404, detail="Файл не найден")
        return FileResponse(path, media_type=row["content_type"] or "application/octet-stream", filename=row["original_name"] or "file")
    finally:
        con.close()

@app.delete("/api/workspaces/{workspace_id}/files/{file_id}")
def delete_workspace_file(workspace_id: int, file_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        _workspace, role = _require_workspace(con, workspace_id, user)
        row = con.execute("SELECT * FROM workspace_files WHERE id=? AND workspace_id=?", (file_id, workspace_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Файл не найден")
        if role != "owner" and not user.is_admin and int(row["uploader_user_id"] or 0) != int(user.id):
            raise HTTPException(status_code=403, detail="Удалить файл может владелец проекта или тот, кто загрузил файл")
        path = os.path.join(WORKSPACE_UPLOAD_DIR, str(int(workspace_id)), row["stored_name"] or "")
        con.execute("DELETE FROM workspace_files WHERE id=? AND workspace_id=?", (file_id, workspace_id))
        _log_workspace_activity(
            con,
            workspace_id,
            user,
            "workspace_file_deleted",
            "workspace_file",
            str(file_id),
            f"Удалён файл «{row['original_name'] or 'Файл'}»",
            {"note_id": row["note_id"] or ""},
        )
        con.commit()
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            pass
        return {"ok": True}
    finally:
        con.close()

@app.get("/api/workspaces/{workspace_id}/snapshots")
def workspace_snapshots(workspace_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        _require_workspace(con, workspace_id, user)
        rows = con.execute(
            """
            SELECT id,workspace_id,actor_user_id,actor_name,reason,state_json,created_at
            FROM workspace_state_snapshots
            WHERE workspace_id=?
            ORDER BY id DESC
            LIMIT 40
            """,
            (workspace_id,),
        ).fetchall()
        return {"snapshots": [_workspace_snapshot_payload(r) for r in rows]}
    finally:
        con.close()

@app.post("/api/workspaces/{workspace_id}/snapshots")
def create_workspace_snapshot(workspace_id: int, body: WorkspaceSnapshotPayload, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        workspace, _role = _require_workspace(con, workspace_id, user, owner_required=True)
        snapshot_id = _create_workspace_snapshot(con, workspace, user, body.reason or "manual")
        _log_workspace_activity(con, workspace_id, user, "snapshot_created", "snapshot", str(snapshot_id), "Создана точка восстановления")
        con.commit()
        row = con.execute(
            "SELECT id,workspace_id,actor_user_id,actor_name,reason,state_json,created_at FROM workspace_state_snapshots WHERE id=?",
            (snapshot_id,),
        ).fetchone()
        return {"ok": True, "snapshot": _workspace_snapshot_payload(row)}
    finally:
        con.close()

@app.post("/api/workspaces/{workspace_id}/snapshots/{snapshot_id}/restore")
def restore_workspace_snapshot(workspace_id: int, snapshot_id: int, user: User = Depends(get_current_user)):
    con = _workspace_con()
    try:
        workspace, _role = _require_workspace(con, workspace_id, user, owner_required=True)
        snap = con.execute(
            "SELECT * FROM workspace_state_snapshots WHERE id=? AND workspace_id=?",
            (snapshot_id, workspace_id),
        ).fetchone()
        if not snap:
            raise HTTPException(status_code=404, detail="Точка восстановления не найдена")
        before_id = _create_workspace_snapshot(con, workspace, user, "before_restore")
        con.execute(
            "UPDATE workspaces SET state_json=?,updated_at=? WHERE id=?",
            (snap["state_json"] or "{}", utc_now_iso(), workspace_id),
        )
        _log_workspace_activity(
            con,
            workspace_id,
            user,
            "snapshot_restored",
            "snapshot",
            str(snapshot_id),
            f"Восстановлен проект из точки #{snapshot_id}",
            {"before_restore_snapshot_id": before_id},
        )
        con.commit()
        row = con.execute("SELECT * FROM workspaces WHERE id=?", (workspace_id,)).fetchone()
        return {
            "ok": True,
            "state": _json_loads_safe(row["state_json"], {}),
            "workspace": _workspace_payload(row, "owner", user),
            "workspaces": _workspace_list_for_user(con, user),
            "archived_workspaces": _workspace_archived_list_for_user(con, user),
            "can_create_workspaces": can_create_workspaces(user),
        }
    finally:
        con.close()

# ── AUTHOR RECIPES ────────────────────────────────────────────────
def _select_publication_sql(extra: str = "") -> str:
    return (
        "SELECT id,author_user_id,recipe_local_id,source_draft_id,version,title,group_name,"
        "volume_ml,price,cost,recipe_json,validation_json,public_description,image_url,"
        "video_url,status,review_comment,review_flags_json,public_slug,bitrix_product_name,"
        "published_at,created_at,updated_at "
        "FROM recipe_publications " + extra
    )

AUTHOR_RECIPE_REQUIRED_FLAGS = {
    "basics": "Основные данные",
    "ingredients": "Ингредиенты",
    "photo": "Фото",
    "process": "Процесс",
    "equipment": "Оборудование",
    "serving": "Подача и срок",
    "organoleptic": "Органолептика",
    "description": "Описание для витрины",
}

def _text_filled(value) -> bool:
    return bool(str(value or "").strip())

def _valid_author_recipe_ingredients(items) -> bool:
    if not isinstance(items, list):
        return False
    for row in items:
        if not isinstance(row, dict):
            continue
        has_item = _text_filled(row.get("mat")) or row.get("semi") is not None or _text_filled(row.get("name"))
        try:
            amount = float(row.get("amt") or 0)
        except Exception:
            amount = 0
        if has_item and amount > 0:
            return True
    return False

def _author_recipe_equipment_names(items) -> list[str]:
    if not isinstance(items, list):
        return []
    names = []
    for item in items:
        name = item if isinstance(item, str) else (item or {}).get("name")
        name = str(name or "").strip()
        if name:
            names.append(name)
    return names

def _source_draft_id_from_recipe_local_id(value: str) -> int:
    try:
        local_id = int(str(value or "").strip())
    except Exception:
        return 0
    if local_id > AUTHOR_DRAFT_CLIENT_ID_OFFSET:
        return local_id - AUTHOR_DRAFT_CLIENT_ID_OFFSET
    return 0

def _author_recipe_image_path(user_id: int, image_url: str) -> str:
    image_url = str(image_url or "").strip()
    prefix = "/api/uploads/author-recipes/"
    if not image_url.startswith(prefix):
        return ""
    rel = image_url[len(prefix):].lstrip("/")
    if ".." in rel or rel.startswith("/"):
        return ""
    owner_token = public_upload_owner_token(user_id)
    allowed_legacy = rel.startswith(f"{user_id}-")
    allowed_folder = rel.startswith(f"{user_id}/")
    allowed_token_folder = rel.startswith(f"{owner_token}/")
    if not allowed_legacy and not allowed_folder and not allowed_token_folder:
        return ""
    return os.path.normpath(os.path.join(AUTHOR_RECIPE_IMAGE_DIR, rel))

def _author_recipe_image_is_valid(user_id: int, image_url: str) -> bool:
    image_url = str(image_url or "").strip()
    if not image_url:
        return False
    if image_url.startswith("data:image/"):
        return True
    path = _author_recipe_image_path(user_id, image_url)
    return bool(path and path.startswith(AUTHOR_RECIPE_IMAGE_DIR) and os.path.isfile(path))

def _normalize_author_recipe_snapshot(body: RecipePublicationPayload, user_id: int) -> tuple[dict, dict]:
    recipe = dict(body.recipe or {})
    image_url = (body.image_url or recipe.get("image_url") or recipe.get("image") or "").strip()
    video_url = (body.video_url or recipe.get("video_url") or recipe.get("videoUrl") or "").strip()
    recipe.update({
        "title": body.title.strip() or recipe.get("title") or "",
        "group": body.group_name.strip() or recipe.get("group") or "",
        "volume_ml": body.volume_ml or recipe.get("volume_ml") or recipe.get("vol") or 0,
        "price": body.price or recipe.get("price") or 0,
        "image_url": image_url,
        "image": image_url,
        "video_url": video_url,
    })
    missing = []
    if not _text_filled(body.title): missing.append("basics")
    if not _text_filled(body.group_name): missing.append("basics")
    if not (float(body.price or 0) > 0): missing.append("basics")
    if not (int(body.volume_ml or 0) > 0): missing.append("basics")
    if not _valid_author_recipe_ingredients(recipe.get("ingredients")): missing.append("ingredients")
    if not _author_recipe_image_is_valid(user_id, image_url): missing.append("photo")
    if not _text_filled(recipe.get("process")): missing.append("process")
    if not _author_recipe_equipment_names(recipe.get("equipment")): missing.append("equipment")
    if not (_text_filled(recipe.get("storage_temp")) and _text_filled(recipe.get("storage_life"))): missing.append("serving")
    if not (_text_filled(recipe.get("appearance")) and _text_filled(recipe.get("taste")) and _text_filled(recipe.get("consistency"))):
        missing.append("organoleptic")
    if not _text_filled(body.public_description): missing.append("description")
    clean_missing = []
    for flag in missing:
        if flag not in clean_missing:
            clean_missing.append(flag)
    validation = {
        "ok": not clean_missing,
        "missing": clean_missing,
        "missing_labels": [AUTHOR_RECIPE_REQUIRED_FLAGS.get(flag, flag) for flag in clean_missing],
    }
    return recipe, validation

def _insert_publication_version(con, pub_id: int, version: int, recipe_json: str, public_description: str, image_url: str, video_url: str, price: float, cost: float, validation_json: str, now: str):
    con.execute(
        "INSERT INTO recipe_publication_versions(publication_id,version,recipe_json,public_description,"
        "image_url,video_url,price,cost,validation_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
        (pub_id, version, recipe_json, public_description, image_url, video_url, price, cost, validation_json, now),
    )

def _insert_publication_event(con, pub_id: int, actor_type: str, actor_id: int, event_type: str, from_status: str = "", to_status: str = "", version: int = 0, comment: str = "", review_flags: list[str] | None = None, now: str | None = None):
    con.execute(
        "INSERT INTO recipe_publication_events(publication_id,actor_type,actor_user_id,event_type,from_status,"
        "to_status,version,comment,review_flags_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
        (
            pub_id,
            actor_type,
            int(actor_id or 0),
            event_type,
            from_status or "",
            to_status or "",
            int(version or 0),
            comment or "",
            json.dumps(review_flags or [], ensure_ascii=False),
            now or utc_now_iso(),
        ),
    )

def _publication_events(con, pub_id: int, limit: int = 20) -> list[dict]:
    rows = con.execute(
        "SELECT id,actor_type,actor_user_id,event_type,from_status,to_status,version,comment,"
        "review_flags_json,created_at FROM recipe_publication_events WHERE publication_id=? "
        "ORDER BY id DESC LIMIT ?",
        (pub_id, limit),
    ).fetchall()
    result = []
    for r in rows:
        try:
            flags = json.loads(r[8] or "[]")
            if not isinstance(flags, list):
                flags = []
        except Exception:
            flags = []
        result.append({
            "id": r[0],
            "actor_type": r[1] or "",
            "actor_user_id": r[2] or 0,
            "event_type": r[3] or "",
            "from_status": r[4] or "",
            "to_status": r[5] or "",
            "version": r[6] or 0,
            "comment": r[7] or "",
            "review_flags": [str(x) for x in flags if str(x).strip()],
            "created_at": r[9] or "",
        })
    return result

def _publication_versions(con, pub_id: int, limit: int = 10) -> list[dict]:
    rows = con.execute(
        "SELECT id,version,public_description,image_url,video_url,price,cost,validation_json,created_at "
        "FROM recipe_publication_versions WHERE publication_id=? ORDER BY version DESC LIMIT ?",
        (pub_id, limit),
    ).fetchall()
    result = []
    for r in rows:
        try:
            validation = json.loads(r[7] or "{}")
        except Exception:
            validation = {}
        result.append({
            "id": r[0],
            "version": r[1] or 0,
            "public_description": r[2] or "",
            "image_url": r[3] or "",
            "video_url": r[4] or "",
            "price": r[5] or 0,
            "cost": r[6] or 0,
            "validation": validation if isinstance(validation, dict) else {},
            "created_at": r[8] or "",
        })
    return result

def _attach_author_to_publication(con, item: dict) -> dict:
    u = con.execute("SELECT email,name FROM users WHERE id=?", (item["author_user_id"],)).fetchone()
    p = con.execute(f"SELECT {AUTHOR_PROFILE_COLUMNS} FROM author_profiles WHERE user_id=?", (item["author_user_id"],)).fetchone()
    profile = author_profile_row(p) if p else {}
    item["author"] = {
        "email": u[0] if u else "",
        "name": u[1] if u else "",
        "public_name": profile.get("public_name") or "",
        "avatar_url": profile.get("avatar_url") or "",
        "bio": profile.get("bio") or "",
        "document_status": profile.get("document_status") or "not_started",
    }
    return item

def _notification_publication(con, pub_id: int) -> dict | None:
    row = con.execute(_select_publication_sql("WHERE id=?"), (pub_id,)).fetchone()
    if not row:
        return None
    item = publication_row(row, include_private=True)
    _attach_author_to_publication(con, item)
    return item

def _notify_author_review_team(con, pub_id: int, action: str = "submitted"):
    """Уведомить команду о новой или повторной отправке рецепта."""
    if not JOIN_MBS_AUTHOR_REVIEW_CHAT_ID:
        return
    try:
        pub = _notification_publication(con, pub_id)
        if not pub:
            return
        author = pub.get("author") or {}
        action_label = "Повторная отправка рецепта" if action == "resubmitted" else "Новый рецепт на проверке"
        admin_url = f"{APP_URL}/?admin=1"
        text = (
            f"{action_label}\n\n"
            f"Рецепт: {pub.get('title') or 'Без названия'}\n"
            f"Автор: {author.get('public_name') or author.get('name') or 'Автор'}\n"
            f"Email: {author.get('email') or 'не указан'}\n"
            f"Версия: v{pub.get('version') or 1}\n\n"
            f"Открыть админку: {admin_url}"
        )
        _join_tg_send(JOIN_MBS_AUTHOR_REVIEW_CHAT_ID, text)
    except Exception as e:
        print(f"[join_mbs_bot] team notify warning pub_id={pub_id}: {e}")

def _notify_author_publication_event(con, pub_id: int, event_type: str):
    """Уведомить автора о событии модерации, если Telegram привязан."""
    try:
        pub = _notification_publication(con, pub_id)
        if not pub:
            return
        profile_row = con.execute(
            "SELECT telegram_chat_id,telegram_username,telegram_notify_enabled FROM author_profiles WHERE user_id=?",
            (pub["author_user_id"],),
        ).fetchone()
        if not profile_row:
            return
        chat_id = profile_row[0] or ""
        notify_enabled = bool(profile_row[2]) if len(profile_row) > 2 else True
        if not chat_id or not notify_enabled:
            return
        title = pub.get("title") or "Ваш рецепт"
        comment = (pub.get("review_comment") or "").strip()
        flags = pub.get("review_flags") or []
        flag_labels = [AUTHOR_RECIPE_REQUIRED_FLAGS.get(str(flag), str(flag)) for flag in flags if str(flag).strip()]
        app_url = f"{APP_URL}/app/author/profile"
        public_url = f"{APP_URL}/recipes/{pub.get('public_slug')}" if pub.get("public_slug") else ""
        if event_type == "rejected":
            details = []
            if comment:
                details.append(f"Комментарий проверки: {comment}")
            if flag_labels:
                details.append("Что нужно поправить: " + ", ".join(flag_labels))
            text = (
                f"Рецепт вернулся на доработку\n\n"
                f"Рецепт: {title}\n"
                + ("\n".join(details) + "\n\n" if details else "\n")
                + f"Откройте кабинет автора и отправьте обновлённую версию повторно: {app_url}"
            )
        elif event_type == "published":
            text = (
                f"Рецепт опубликован\n\n"
                f"Рецепт: {title}\n"
                f"Он готов к продаже на витрине."
            )
            if public_url:
                text += f"\n\nСсылка: {public_url}"
        elif event_type == "archived":
            text = (
                f"Рецепт снят с публикации\n\n"
                f"Рецепт: {title}\n"
                f"Если нужно вернуть его на витрину, напишите команде школы."
            )
        elif event_type == "review_saved":
            if not comment and not flag_labels:
                return
            text = (
                f"Проверка рецепта обновлена\n\n"
                f"Рецепт: {title}\n"
            )
            if comment:
                text += f"\nКомментарий: {comment}"
            if flag_labels:
                text += "\nЧто нужно поправить: " + ", ".join(flag_labels)
            text += f"\n\nКабинет автора: {app_url}"
        else:
            return
        _join_tg_send(chat_id, text)
    except Exception as e:
        print(f"[join_mbs_bot] author notify warning pub_id={pub_id}: {e}")

def _bitrix_call(method: str, payload: dict) -> dict:
    webhook = os.getenv("BITRIX_WEBHOOK", "").rstrip("/")
    if not webhook:
        return {}
    url = f"{webhook}/{method}.json"
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())

def _norm_phone(value: str) -> str:
    digits = re.sub(r"\D+", "", value or "")
    if not digits:
        return ""
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    if len(digits) == 10:
        digits = "7" + digits
    return "+" + digits if digits else ""

def _bitrix_values(value) -> list:
    if value in (None, "", False):
        return []
    if isinstance(value, list):
        result = []
        for item in value:
            if isinstance(item, dict):
                raw = item.get("VALUE") or item.get("value") or item.get("ID") or item.get("id")
            else:
                raw = item
            if raw not in (None, "", False):
                result.append(str(raw))
        return result
    return [str(value)]

def _bitrix_find_contact(phone: str = "", email: str = "") -> dict:
    phone_norm = _norm_phone(phone)
    variants = []
    if phone_norm:
        digits = re.sub(r"\D+", "", phone_norm)
        variants.extend([phone_norm, digits, digits[-10:]])
    for value in [v for v in variants if v]:
        rows = _bitrix_call("crm.contact.list", {
            "filter": {"PHONE": value},
            "select": ["ID", "NAME", "LAST_NAME", "PHONE", "EMAIL"],
        }).get("result") or []
        if rows:
            contact_id = rows[0].get("ID")
            return _bitrix_call("crm.contact.get", {"id": contact_id}).get("result") or rows[0]
    if phone_norm:
        digits = re.sub(r"\D+", "", phone_norm)
        dup = _bitrix_call("crm.duplicate.findbycomm", {
            "type": "PHONE",
            "values": [digits],
            "entity_type": "CONTACT",
        }).get("result") or {}
        ids = dup.get("CONTACT") or []
        if ids:
            return _bitrix_call("crm.contact.get", {"id": ids[0]}).get("result") or {"ID": ids[0]}
    if email:
        rows = _bitrix_call("crm.contact.list", {
            "filter": {"EMAIL": email},
            "select": ["ID", "NAME", "LAST_NAME", "PHONE", "EMAIL"],
        }).get("result") or []
        if rows:
            contact_id = rows[0].get("ID")
            return _bitrix_call("crm.contact.get", {"id": contact_id}).get("result") or rows[0]
        dup = _bitrix_call("crm.duplicate.findbycomm", {
            "type": "EMAIL",
            "values": [email],
            "entity_type": "CONTACT",
        }).get("result") or {}
        ids = dup.get("CONTACT") or []
        if ids:
            return _bitrix_call("crm.contact.get", {"id": ids[0]}).get("result") or {"ID": ids[0]}
    return {}

def _bitrix_author_enum_id() -> str:
    if not os.getenv("BITRIX_WEBHOOK", ""):
        raise RuntimeError("BITRIX_WEBHOOK не задан")
    field_name = os.getenv("BITRIX_AUTHOR_MARK_FIELD", "UF_CRM_1766349995197")
    label = os.getenv("BITRIX_AUTHOR_MARK_LABEL", "Автор рецептов")
    rows = _bitrix_call("crm.contact.userfield.list", {"filter": {"FIELD_NAME": field_name}}).get("result") or []
    if isinstance(rows, dict):
        rows = [rows]
    for field in rows:
        for item in (field.get("LIST") or field.get("list") or []):
            value = str(item.get("VALUE") or item.get("value") or "").strip().lower()
            if value == label.strip().lower():
                return str(item.get("ID") or item.get("id") or "")
    raise RuntimeError(f"Не найдено значение Битрикс «{label}» в поле {field_name}")

def _bitrix_create_contact_for_author(user: User, profile: dict) -> dict:
    phone = _norm_phone(profile.get("phone") or user.phone or "")
    email = (profile.get("email") or user.email or "").strip().lower()
    fields = _bitrix_author_contact_fields(user, profile, include_photo=True)
    fields["SOURCE_ID"] = os.getenv("BITRIX_AUTHOR_SOURCE_ID", "WEB")
    if not fields.get("NAME") and not fields.get("LAST_NAME"):
        fields["NAME"] = (profile.get("full_name") or profile.get("public_name") or user.name or email or "Автор рецептов").strip()
    if phone:
        fields["PHONE"] = [{"VALUE": phone, "VALUE_TYPE": "WORK"}]
    if email:
        fields["EMAIL"] = [{"VALUE": email, "VALUE_TYPE": "WORK"}]
    result = _bitrix_call("crm.contact.add", {"fields": fields})
    contact_id = str(result.get("result") or "")
    if not contact_id:
        raise RuntimeError("Битрикс не вернул ID созданного контакта")
    return _bitrix_call("crm.contact.get", {"id": contact_id}).get("result") or {"ID": contact_id}

def _avatar_file_data(avatar_url: str):
    if not avatar_url:
        return None
    if avatar_url.startswith("/api/uploads/authors/"):
        filename = os.path.basename(avatar_url)
        path = os.path.join(AUTHOR_AVATAR_DIR, filename)
    elif avatar_url.startswith("/api/uploads/accounts/"):
        filename = os.path.basename(avatar_url)
        path = os.path.join(ACCOUNT_AVATAR_DIR, filename)
    else:
        return None
    if not os.path.isfile(path):
        return None
    with open(path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("ascii")
    return {"fileData": [filename, encoded]}

def _bitrix_account_contact_fields(user: User, include_photo: bool = False) -> dict:
    phone = _norm_phone(user.phone or "")
    fields = {
        "NAME": (user.name or user.email or "").strip(),
    }
    if phone:
        fields["PHONE"] = [{"VALUE": phone, "VALUE_TYPE": "WORK"}]
    if user.email:
        fields["EMAIL"] = [{"VALUE": (user.email or "").strip().lower(), "VALUE_TYPE": "WORK"}]
    if include_photo:
        photo = _avatar_file_data(user.avatar_url or "")
        if photo:
            fields["PHOTO"] = photo
    return fields

def _sync_account_bitrix_contact(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        if not os.getenv("BITRIX_WEBHOOK", ""):
            raise RuntimeError("BITRIX_WEBHOOK не задан")
        contact = {}
        if user.bitrix_contact_id:
            contact = _bitrix_call("crm.contact.get", {"id": user.bitrix_contact_id}).get("result") or {}
        if not contact:
            contact = _bitrix_find_contact(user.phone or "", user.email or "")
        fields = _bitrix_account_contact_fields(user, include_photo=True)
        if contact and contact.get("ID"):
            contact_id = str(contact.get("ID"))
            _bitrix_call("crm.contact.update", {"id": contact_id, "fields": fields})
        else:
            fields["SOURCE_ID"] = os.getenv("BITRIX_ACCOUNT_SOURCE_ID", "WEB")
            result = _bitrix_call("crm.contact.add", {"fields": fields})
            contact_id = str(result.get("result") or "")
            if not contact_id:
                raise RuntimeError("Битрикс не вернул ID созданного контакта")
        user.bitrix_contact_id = contact_id
        user.bitrix_sync_status = "synced"
        user.bitrix_sync_error = ""
        user.bitrix_synced_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.bitrix_sync_status = "error"
                user.bitrix_sync_error = str(e)[:500]
                db.commit()
        except Exception:
            db.rollback()
        print(f"[bitrix] account sync warning user_id={user_id}: {e}")
    finally:
        db.close()

def _queue_account_bitrix_sync(user_id: int, background_tasks: BackgroundTasks):
    background_tasks.add_task(_sync_account_bitrix_contact, user_id)

def _bitrix_author_contact_fields(user: User, profile: dict, include_photo: bool = False) -> dict:
    first_name = (profile.get("first_name") or "").strip()
    last_name = (profile.get("last_name") or "").strip()
    patronymic = (profile.get("patronymic") or "").strip()
    if not first_name and not last_name and not patronymic:
        legacy = _split_legacy_author_name(profile.get("full_name") or "", profile.get("public_name") or user.name or "")
        first_name = legacy["first_name"]
        last_name = legacy["last_name"]
        patronymic = legacy["patronymic"]
    fields = {
        "NAME": first_name or (profile.get("public_name") or user.name or "").strip(),
        "LAST_NAME": last_name,
        "SECOND_NAME": patronymic,
    }
    if include_photo:
        photo = _avatar_file_data(profile.get("avatar_url") or "")
        if photo:
            fields["PHOTO"] = photo
    return fields

def _bitrix_update_contact_for_author(contact_id: str, user: User, profile: dict):
    fields = _bitrix_author_contact_fields(user, profile, include_photo=True)
    if fields:
        _bitrix_call("crm.contact.update", {"id": contact_id, "fields": fields})

def _bitrix_mark_author_contact(contact: dict, user: User, profile: dict) -> str:
    contact_id = str(contact.get("ID") or "")
    if not contact_id:
        raise RuntimeError("Не найден ID контакта Битрикс")
    field_name = os.getenv("BITRIX_AUTHOR_MARK_FIELD", "UF_CRM_1766349995197")
    mark_error = None
    mark_added = False
    try:
        enum_id = _bitrix_author_enum_id()
        current = _bitrix_values(contact.get(field_name))
        if enum_id and enum_id not in current:
            current.append(enum_id)
            _bitrix_call("crm.contact.update", {"id": contact_id, "fields": {field_name: current}})
            mark_added = True
    except Exception as e:
        mark_error = e
    if mark_added:
        comment = (
            "[ПЛАТФОРМА РЕЦЕПТОВ]\n"
            "Клиент добавлен как автор рецептов.\n"
            f"Дата: {utc_now_iso()} UTC\n"
            f"Платформа user_id: {user.id}\n"
            f"Имя: {profile.get('full_name') or user.name or ''}\n"
            f"Публичное имя: {profile.get('public_name') or ''}\n"
            f"Email: {profile.get('email') or user.email or ''}\n"
            f"Телефон: {profile.get('phone') or user.phone or ''}\n"
            "Источник: barista-school.online/admin"
        )
        try:
            _bitrix_call("crm.timeline.comment.add", {
                "fields": {
                    "ENTITY_ID": contact_id,
                    "ENTITY_TYPE": "CONTACT",
                    "COMMENT": comment,
                }
            })
        except Exception as e:
            print(f"[bitrix author sync] timeline warning user_id={user.id}: {e}")
    if mark_error:
        raise mark_error
    return contact_id

def _ensure_author_profile_for_user(con, user: User, status: str = "pending") -> dict:
    now = utc_now_iso()
    row = con.execute(
        f"SELECT {AUTHOR_PROFILE_COLUMNS} FROM author_profiles WHERE user_id=?",
        (user.id,),
    ).fetchone()
    if row:
        con.execute(
            "UPDATE author_profiles SET bitrix_sync_status=?,bitrix_sync_error='',updated_at=? WHERE user_id=?",
            (status, now, user.id),
        )
        return author_profile_row(row)
    legacy = _split_legacy_author_name(user.name or "")
    full_name = _author_full_name(legacy["first_name"], legacy["last_name"], legacy["patronymic"]) or (user.name or "")
    public_name = _author_public_name(legacy["first_name"], legacy["last_name"], user.name or "")
    con.execute(
        "INSERT INTO author_profiles(full_name,public_name,first_name,last_name,patronymic,avatar_url,"
        "phone,email,telegram,bio,document_status,bitrix_contact_id,bitrix_sync_status,"
        "bitrix_sync_error,bitrix_synced_at,mixology_participant_id,created_at,updated_at,user_id) "
        "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        (
            full_name,
            public_name,
            legacy["first_name"],
            legacy["last_name"],
            legacy["patronymic"],
            "",
            user.phone or "",
            user.email or "",
            "",
            "",
            "not_started",
            "",
            status,
            "",
            "",
            "",
            now,
            now,
            user.id,
        ),
    )
    row = con.execute(
        f"SELECT {AUTHOR_PROFILE_COLUMNS} FROM author_profiles WHERE user_id=?",
        (user.id,),
    ).fetchone()
    return author_profile_row(row)

def _set_author_bitrix_sync_status(user_id: int, status: str, error: str = "", contact_id: str = ""):
    import sqlite3 as _sq
    now = utc_now_iso()
    con = _sq.connect(app_db_path())
    if contact_id:
        con.execute(
            "UPDATE author_profiles SET bitrix_contact_id=?,bitrix_sync_status=?,bitrix_sync_error=?,"
            "bitrix_synced_at=?,updated_at=? WHERE user_id=?",
            (contact_id, status, (error or "")[:500], now if status == "synced" else "", now, user_id),
        )
    else:
        con.execute(
            "UPDATE author_profiles SET bitrix_sync_status=?,bitrix_sync_error=?,updated_at=? WHERE user_id=?",
            (status, (error or "")[:500], now, user_id),
        )
    con.commit()
    con.close()

def _sync_author_to_bitrix(user_id: int):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        if not os.getenv("BITRIX_WEBHOOK", ""):
            raise RuntimeError("BITRIX_WEBHOOK не задан")
        import sqlite3 as _sq
        con = _sq.connect(app_db_path())
        try:
            profile = _ensure_author_profile_for_user(con, user, status="pending")
            con.commit()
        finally:
            con.close()
        contact = {}
        if profile.get("bitrix_contact_id"):
            contact = _bitrix_call("crm.contact.get", {"id": profile["bitrix_contact_id"]}).get("result") or {}
        if not contact:
            contact = _bitrix_find_contact(profile.get("phone") or user.phone or "", profile.get("email") or user.email or "")
        if not contact:
            contact = _bitrix_create_contact_for_author(user, profile)
        if contact.get("ID"):
            _set_author_bitrix_sync_status(user.id, "pending", "", str(contact.get("ID")))
            _bitrix_update_contact_for_author(str(contact.get("ID")), user, profile)
        contact_id = _bitrix_mark_author_contact(contact, user, profile)
        _set_author_bitrix_sync_status(user.id, "synced", "", contact_id)
    except Exception as e:
        print(f"[bitrix author sync] error user_id={user_id}: {e}")
        _set_author_bitrix_sync_status(user_id, "error", str(e))
    finally:
        db.close()

def _queue_author_bitrix_sync(user_id: int, background_tasks: BackgroundTasks):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        import sqlite3 as _sq
        con = _sq.connect(app_db_path())
        try:
            _ensure_author_profile_for_user(con, user, status="pending")
            con.commit()
        finally:
            con.close()
    finally:
        db.close()
    background_tasks.add_task(_sync_author_to_bitrix, user_id)

def _push_recipe_order_to_bitrix(pub: dict, order: RecipeOrderPayload) -> str:
    if not os.getenv("BITRIX_WEBHOOK", ""):
        return ""
    contact_id = ""
    contact_fields = {"NAME": order.customer_name or "Покупатель рецепта"}
    if order.customer_phone:
        contact_fields["PHONE"] = [{"VALUE": order.customer_phone, "VALUE_TYPE": "WORK"}]
    if order.customer_email:
        contact_fields["EMAIL"] = [{"VALUE": order.customer_email, "VALUE_TYPE": "WORK"}]
    try:
        contact_res = _bitrix_call("crm.contact.add", {"fields": contact_fields})
        contact_id = str(contact_res.get("result") or "")
    except Exception as e:
        print(f"[bitrix recipe order] contact warning: {e}")

    recipe_field = os.getenv("BITRIX_RECIPE_FIELD", "UF_CRM_1772130466840")
    category_id = int(os.getenv("MIXOLOGY_CATEGORY_ID", "28"))
    fields = {
        "TITLE": f"Заказ рецепта: {pub['title']}",
        "CATEGORY_ID": category_id,
        "OPPORTUNITY": float(pub.get("price") or 0),
        "CURRENCY_ID": "RUB",
        recipe_field: pub.get("bitrix_product_name") or pub.get("title"),
        "COMMENTS": (
            f"Источник: {order.source}\n"
            f"Рецепт: {pub.get('title')}\n"
            f"Автор user_id: {pub.get('author_user_id')}\n"
            f"Комментарий: {order.comment or ''}"
        ),
    }
    if contact_id:
        fields["CONTACT_ID"] = contact_id
    deal_res = _bitrix_call("crm.deal.add", {"fields": fields})
    return str(deal_res.get("result") or "")

@app.get("/api/author/profile")
def get_author_profile(user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    try:
        _sync_author_championship_participations(con, user)
        con.commit()
        row = con.execute(
            f"SELECT {AUTHOR_PROFILE_COLUMNS} FROM author_profiles WHERE user_id=?",
            (user.id,),
        ).fetchone()
        participations = _author_championship_participations(con, user.id)
    finally:
        con.close()
    if row:
        profile = author_profile_row(row)
        profile["championship_participations"] = participations
        return profile
    profile = {
        "user_id": user.id,
        "full_name": user.name or "",
        "public_name": user.name or "",
        "first_name": user.name or "",
        "last_name": "",
        "patronymic": "",
        "avatar_url": "",
        "phone": user.phone or "",
        "email": user.email or "",
        "telegram": "",
        "bio": "",
        "document_status": "not_started",
        "bitrix_contact_id": "",
        "bitrix_sync_status": "",
        "bitrix_sync_error": "",
        "bitrix_synced_at": "",
        "mixology_participant_id": "",
    }
    profile["championship_participations"] = participations
    return profile

@app.put("/api/author/profile")
def save_author_profile(
    body: AuthorProfilePayload,
    background_tasks: BackgroundTasks,
    user: User = Depends(get_current_user),
):
    require_author_access(user)
    import sqlite3 as _sq
    now = utc_now_iso()
    con = _sq.connect(app_db_path())
    row = con.execute(f"SELECT {AUTHOR_PROFILE_COLUMNS} FROM author_profiles WHERE user_id=?", (user.id,)).fetchone()
    existing = author_profile_row(row) if row else {}
    first_name = body.first_name.strip()
    last_name = body.last_name.strip()
    patronymic = body.patronymic.strip()
    if not first_name and not last_name and not patronymic:
        legacy = _split_legacy_author_name(body.full_name, body.public_name)
        first_name = legacy["first_name"]
        last_name = legacy["last_name"]
        patronymic = legacy["patronymic"]
    full_name = _author_full_name(first_name, last_name, patronymic)
    public_name = _author_public_name(first_name, last_name, body.public_name)
    telegram = body.telegram.strip() if body.telegram is not None else (existing.get("telegram") or "")
    bitrix_contact_id = body.bitrix_contact_id.strip() or (existing.get("bitrix_contact_id") if existing else "")
    mixology_participant_id = body.mixology_participant_id.strip() or (existing.get("mixology_participant_id") if existing else "")
    document_status = body.document_status.strip() or (existing.get("document_status") if existing else "not_started")
    avatar_url = existing.get("avatar_url") if existing else ""
    values = (
        full_name,
        public_name,
        first_name,
        last_name,
        patronymic,
        avatar_url,
        body.phone.strip(),
        body.email.strip(),
        telegram,
        body.bio.strip(),
        document_status,
        bitrix_contact_id,
        mixology_participant_id,
        now,
        user.id,
    )
    if row:
        con.execute(
            "UPDATE author_profiles SET full_name=?,public_name=?,first_name=?,last_name=?,patronymic=?,"
            "avatar_url=?,phone=?,email=?,telegram=?,bio=?,document_status=?,bitrix_contact_id=?,"
            "mixology_participant_id=?,updated_at=? WHERE user_id=?",
            values,
        )
    else:
        con.execute(
            "INSERT INTO author_profiles(full_name,public_name,first_name,last_name,patronymic,avatar_url,"
            "phone,email,telegram,bio,document_status,bitrix_contact_id,mixology_participant_id,"
            "created_at,updated_at,user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            values[:-2] + (now, now, user.id),
        )
    con.commit()
    con.close()
    _queue_author_bitrix_sync(user.id, background_tasks)
    return {"ok": True, "public_name": public_name}

@app.get("/api/author/telegram/status")
def get_author_telegram_status(user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    try:
        row = con.execute(
            "SELECT telegram_chat_id,telegram_username,telegram_bound_at,telegram_notify_enabled "
            "FROM author_profiles WHERE user_id=?",
            (user.id,),
        ).fetchone()
    finally:
        con.close()
    return {
        "bot_username": JOIN_MBS_BOT_USERNAME,
        "configured": bool(JOIN_MBS_BOT_TOKEN),
        "connected": bool(row and row[0]),
        "username": (row[1] if row else "") or "",
        "bound_at": (row[2] if row else "") or "",
        "notify_enabled": bool(row[3]) if row else True,
    }

@app.post("/api/author/telegram/link")
def create_author_telegram_link(user: User = Depends(get_current_user)):
    require_author_access(user)
    if not JOIN_MBS_BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram-бот пока не настроен")
    import sqlite3 as _sq
    now = utc_now_iso()
    expires = (datetime.utcnow() + timedelta(minutes=15)).replace(microsecond=0).isoformat()
    token = secrets.token_urlsafe(18)
    con = _sq.connect(app_db_path())
    try:
        con.execute(
            "INSERT INTO author_telegram_link_tokens(token,user_id,expires_at,used_at,created_at) VALUES(?,?,?,?,?)",
            (token, user.id, expires, "", now),
        )
        con.commit()
    finally:
        con.close()
    return {"ok": True, "url": _join_author_link_url(token), "expires_at": expires, "bot_username": JOIN_MBS_BOT_USERNAME}

@app.delete("/api/author/telegram/link")
def delete_author_telegram_link(user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    now = utc_now_iso()
    con = _sq.connect(app_db_path())
    try:
        con.execute(
            "UPDATE author_profiles SET telegram_chat_id='',telegram_username='',telegram_bound_at='',"
            "telegram_notify_enabled=0,updated_at=? WHERE user_id=?",
            (now, user.id),
        )
        con.commit()
    finally:
        con.close()
    return {"ok": True}

@app.put("/api/author/telegram/settings")
def update_author_telegram_settings(body: AuthorTelegramSettingsPayload, user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    now = utc_now_iso()
    con = _sq.connect(app_db_path())
    try:
        row = con.execute("SELECT id FROM author_profiles WHERE user_id=?", (user.id,)).fetchone()
        if not row:
            _ensure_author_profile_for_user(con, user, status="pending")
        con.execute(
            "UPDATE author_profiles SET telegram_notify_enabled=?,updated_at=? WHERE user_id=?",
            (1 if body.notify_enabled else 0, now, user.id),
        )
        con.commit()
    finally:
        con.close()
    return {"ok": True, "notify_enabled": bool(body.notify_enabled)}

@app.post("/api/author/profile/avatar")
def upload_author_avatar(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    require_author_access(user)
    allowed = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    content_type = (file.content_type or "").lower()
    ext = allowed.get(content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Можно загрузить только JPG, PNG или WebP")
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Файл пустой")
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Фото должно быть не больше 5 МБ")
    safe_name = f"{public_upload_owner_token(user.id)}-{int(time.time())}-{secrets.token_hex(4)}.{ext}"
    path = os.path.join(AUTHOR_AVATAR_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(data)
    avatar_url = f"/api/uploads/authors/{safe_name}"
    import sqlite3 as _sq
    now = utc_now_iso()
    con = _sq.connect(app_db_path())
    row = con.execute(f"SELECT {AUTHOR_PROFILE_COLUMNS} FROM author_profiles WHERE user_id=?", (user.id,)).fetchone()
    if row:
        con.execute(
            "UPDATE author_profiles SET avatar_url=?,updated_at=? WHERE user_id=?",
            (avatar_url, now, user.id),
        )
    else:
        legacy = _split_legacy_author_name(user.name or "")
        full_name = _author_full_name(legacy["first_name"], legacy["last_name"], legacy["patronymic"]) or (user.name or "")
        public_name = _author_public_name(legacy["first_name"], legacy["last_name"], user.name or "")
        con.execute(
            "INSERT INTO author_profiles(full_name,public_name,first_name,last_name,patronymic,avatar_url,"
            "phone,email,telegram,bio,document_status,bitrix_contact_id,mixology_participant_id,"
            "created_at,updated_at,user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                full_name,
                public_name,
                legacy["first_name"],
                legacy["last_name"],
                legacy["patronymic"],
                avatar_url,
                user.phone or "",
                user.email or "",
                "",
                "",
                "not_started",
                "",
                "",
                now,
                now,
                user.id,
            ),
        )
    con.commit()
    con.close()
    _queue_author_bitrix_sync(user.id, background_tasks)
    return {"ok": True, "avatar_url": avatar_url}

@app.get("/api/author/drafts")
def list_author_drafts(user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    rows = con.execute(
        "SELECT id,author_user_id,title,group_name,volume_ml,price,draft_json,status,created_at,updated_at "
        "FROM author_recipe_drafts WHERE author_user_id=? ORDER BY updated_at DESC, id DESC",
        (user.id,),
    ).fetchall()
    con.close()
    return [author_draft_row(r) for r in rows]

@app.post("/api/author/drafts")
def create_author_draft(body: AuthorDraftPayload, user: User = Depends(get_current_user)):
    require_author_access(user)
    title = body.title.strip() or str((body.draft or {}).get("name") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Название рецепта обязательно")
    import sqlite3 as _sq
    now = utc_now_iso()
    draft = dict(body.draft or {})
    draft["name"] = title
    draft["group"] = body.group_name.strip() or draft.get("group") or "hot"
    draft["vol"] = body.volume_ml or draft.get("vol") or 0
    draft["price"] = body.price or draft.get("price") or 0
    draft_json = json.dumps(draft, ensure_ascii=False)
    con = _sq.connect(app_db_path())
    cur = con.execute(
        "INSERT INTO author_recipe_drafts(author_user_id,title,group_name,volume_ml,price,draft_json,status,created_at,updated_at) "
        "VALUES(?,?,?,?,?,?,?,?,?)",
        (
            user.id,
            title,
            draft["group"],
            int(draft["vol"] or 0),
            float(draft["price"] or 0),
            draft_json,
            "draft",
            now,
            now,
        ),
    )
    draft_id = cur.lastrowid
    row = con.execute(
        "SELECT id,author_user_id,title,group_name,volume_ml,price,draft_json,status,created_at,updated_at "
        "FROM author_recipe_drafts WHERE id=? AND author_user_id=?",
        (draft_id, user.id),
    ).fetchone()
    con.commit()
    con.close()
    return author_draft_row(row)

@app.put("/api/author/drafts/{draft_id}")
def update_author_draft(draft_id: int, body: AuthorDraftPayload, user: User = Depends(get_current_user)):
    require_author_access(user)
    title = body.title.strip() or str((body.draft or {}).get("name") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Название рецепта обязательно")
    import sqlite3 as _sq
    now = utc_now_iso()
    draft = dict(body.draft or {})
    draft["name"] = title
    draft["group"] = body.group_name.strip() or draft.get("group") or "hot"
    draft["vol"] = body.volume_ml or draft.get("vol") or 0
    draft["price"] = body.price or draft.get("price") or 0
    draft_json = json.dumps(draft, ensure_ascii=False)
    con = _sq.connect(app_db_path())
    found = con.execute(
        "SELECT id FROM author_recipe_drafts WHERE id=? AND author_user_id=?",
        (draft_id, user.id),
    ).fetchone()
    if not found:
        con.close()
        raise HTTPException(status_code=404, detail="Черновик не найден")
    con.execute(
        "UPDATE author_recipe_drafts SET title=?,group_name=?,volume_ml=?,price=?,draft_json=?,updated_at=? "
        "WHERE id=? AND author_user_id=?",
        (
            title,
            draft["group"],
            int(draft["vol"] or 0),
            float(draft["price"] or 0),
            draft_json,
            now,
            draft_id,
            user.id,
        ),
    )
    row = con.execute(
        "SELECT id,author_user_id,title,group_name,volume_ml,price,draft_json,status,created_at,updated_at "
        "FROM author_recipe_drafts WHERE id=? AND author_user_id=?",
        (draft_id, user.id),
    ).fetchone()
    con.commit()
    con.close()
    return author_draft_row(row)

@app.delete("/api/author/drafts/{draft_id}")
def delete_author_draft(draft_id: int, user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    con.execute("DELETE FROM author_recipe_drafts WHERE id=? AND author_user_id=?", (draft_id, user.id))
    con.commit()
    con.close()
    return {"ok": True}

@app.get("/api/author/ingredients")
def list_author_ingredients(user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    rows = con.execute(
        "SELECT id,author_user_id,mat_key,name,category,ingredient_json,supplier_json,created_at,updated_at "
        "FROM author_ingredients WHERE author_user_id=? ORDER BY updated_at DESC, id DESC",
        (user.id,),
    ).fetchall()
    con.close()
    return [author_ingredient_row(r) for r in rows]

@app.put("/api/author/ingredients/{mat_key}")
def upsert_author_ingredient(mat_key: str, body: AuthorIngredientPayload, user: User = Depends(get_current_user)):
    require_author_access(user)
    key = (body.key or mat_key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="Ключ ингредиента обязателен")
    ingredient = dict(body.ingredient or {})
    supplier = dict(body.supplier or {})
    name = str(ingredient.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Название ингредиента обязательно")
    category = str(ingredient.get("category") or "other").strip() or "other"
    ingredient["custom"] = True
    ingredient["_authorIngredient"] = True
    now = utc_now_iso()
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    con.execute(
        "INSERT INTO author_ingredients(author_user_id,mat_key,name,category,ingredient_json,supplier_json,created_at,updated_at) "
        "VALUES(?,?,?,?,?,?,?,?) "
        "ON CONFLICT(author_user_id, mat_key) DO UPDATE SET "
        "name=excluded.name, category=excluded.category, ingredient_json=excluded.ingredient_json, "
        "supplier_json=excluded.supplier_json, updated_at=excluded.updated_at",
        (
            user.id,
            key,
            name,
            category,
            json.dumps(ingredient, ensure_ascii=False),
            json.dumps(supplier, ensure_ascii=False),
            now,
            now,
        ),
    )
    row = con.execute(
        "SELECT id,author_user_id,mat_key,name,category,ingredient_json,supplier_json,created_at,updated_at "
        "FROM author_ingredients WHERE author_user_id=? AND mat_key=?",
        (user.id, key),
    ).fetchone()
    con.commit()
    con.close()
    return author_ingredient_row(row)

@app.delete("/api/author/ingredients/{mat_key}")
def delete_author_ingredient(mat_key: str, user: User = Depends(get_current_user)):
    require_author_access(user)
    key = (mat_key or "").strip()
    if not key:
        raise HTTPException(status_code=400, detail="Ключ ингредиента обязателен")
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    con.execute("DELETE FROM author_ingredients WHERE author_user_id=? AND mat_key=?", (user.id, key))
    con.commit()
    con.close()
    return {"ok": True}

@app.get("/api/author/semis")
def list_author_semis(user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    rows = con.execute(
        "SELECT id,author_user_id,name,category,semi_json,created_at,updated_at "
        "FROM author_semis WHERE author_user_id=? ORDER BY updated_at DESC, id DESC",
        (user.id,),
    ).fetchall()
    con.close()
    return [author_semi_row(r) for r in rows]

@app.post("/api/author/semis")
def create_author_semi(body: AuthorSemiPayload, user: User = Depends(get_current_user)):
    require_author_access(user)
    semi = dict(body.semi or {})
    name = str(semi.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Название полуфабриката обязательно")
    category = str(semi.get("category") or "semi_default").strip() or "semi_default"
    semi["name"] = name
    semi["category"] = category
    semi["_authorSemi"] = True
    now = utc_now_iso()
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    cur = con.execute(
        "INSERT INTO author_semis(author_user_id,name,category,semi_json,created_at,updated_at) VALUES(?,?,?,?,?,?)",
        (
            user.id,
            name,
            category,
            json.dumps(semi, ensure_ascii=False),
            now,
            now,
        ),
    )
    semi_id = cur.lastrowid
    row = con.execute(
        "SELECT id,author_user_id,name,category,semi_json,created_at,updated_at FROM author_semis WHERE id=? AND author_user_id=?",
        (semi_id, user.id),
    ).fetchone()
    con.commit()
    con.close()
    return author_semi_row(row)

@app.put("/api/author/semis/{semi_id}")
def update_author_semi(semi_id: int, body: AuthorSemiPayload, user: User = Depends(get_current_user)):
    require_author_access(user)
    semi = dict(body.semi or {})
    name = str(semi.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Название полуфабриката обязательно")
    category = str(semi.get("category") or "semi_default").strip() or "semi_default"
    semi["name"] = name
    semi["category"] = category
    semi["_authorSemiId"] = semi_id
    semi["_authorSemi"] = True
    now = utc_now_iso()
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    found = con.execute(
        "SELECT id FROM author_semis WHERE id=? AND author_user_id=?",
        (semi_id, user.id),
    ).fetchone()
    if not found:
        con.close()
        raise HTTPException(status_code=404, detail="Полуфабрикат не найден")
    con.execute(
        "UPDATE author_semis SET name=?,category=?,semi_json=?,updated_at=? WHERE id=? AND author_user_id=?",
        (
            name,
            category,
            json.dumps(semi, ensure_ascii=False),
            now,
            semi_id,
            user.id,
        ),
    )
    row = con.execute(
        "SELECT id,author_user_id,name,category,semi_json,created_at,updated_at FROM author_semis WHERE id=? AND author_user_id=?",
        (semi_id, user.id),
    ).fetchone()
    con.commit()
    con.close()
    return author_semi_row(row)

@app.delete("/api/author/semis/{semi_id}")
def delete_author_semi(semi_id: int, user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    con.execute("DELETE FROM author_semis WHERE id=? AND author_user_id=?", (semi_id, user.id))
    con.commit()
    con.close()
    return {"ok": True}

@app.post("/api/author/recipe-image")
def upload_author_recipe_image(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    require_author_access(user)
    allowed = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
    }
    content_type = (file.content_type or "").lower()
    ext = allowed.get(content_type)
    if not ext:
        raise HTTPException(status_code=400, detail="Можно загрузить только JPG, PNG или WebP")
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Файл пустой")
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Фото должно быть не больше 5 МБ")
    owner_token = public_upload_owner_token(user.id)
    user_dir = os.path.join(AUTHOR_RECIPE_IMAGE_DIR, owner_token)
    os.makedirs(user_dir, exist_ok=True)
    safe_name = f"{int(time.time())}-{secrets.token_hex(4)}.{ext}"
    path = os.path.join(user_dir, safe_name)
    with open(path, "wb") as f:
        f.write(data)
    return {"ok": True, "image_url": f"/api/uploads/author-recipes/{owner_token}/{safe_name}"}

@app.get("/api/author/recipes")
def list_author_recipes(user: User = Depends(get_current_user)):
    require_author_access(user)
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    rows = con.execute(
        _select_publication_sql("WHERE author_user_id=? ORDER BY updated_at DESC, id DESC"),
        (user.id,),
    ).fetchall()
    result = []
    for r in rows:
        item = publication_row(r, include_private=True)
        item["events"] = _publication_events(con, item["id"], limit=10)
        item["versions"] = _publication_versions(con, item["id"], limit=5)
        result.append(item)
    con.close()
    return result

@app.post("/api/author/recipes")
def submit_author_recipe(body: RecipePublicationPayload, user: User = Depends(get_current_user)):
    require_author_access(user)
    if not body.title.strip():
        raise HTTPException(status_code=400, detail="Название рецепта обязательно")
    import sqlite3 as _sq
    now = utc_now_iso()
    source_draft_id = _source_draft_id_from_recipe_local_id(body.recipe_local_id)
    recipe, validation = _normalize_author_recipe_snapshot(body, user.id)
    if not validation["ok"]:
        raise HTTPException(status_code=400, detail={
            "message": "Заполните обязательные поля для публикации",
            "missing": validation["missing"],
            "missing_labels": validation["missing_labels"],
        })
    recipe_json = json.dumps(recipe, ensure_ascii=False)
    validation_json = json.dumps(validation, ensure_ascii=False)
    image_url = recipe.get("image_url") or body.image_url.strip()
    video_url = recipe.get("video_url") or body.video_url.strip()
    con = _sq.connect(app_db_path())
    try:
        existing = None
        if source_draft_id:
            existing = con.execute(
                "SELECT id,status,version FROM recipe_publications WHERE author_user_id=? AND source_draft_id=? AND status!='archived' ORDER BY id DESC LIMIT 1",
                (user.id, source_draft_id),
            ).fetchone()
        if not existing and body.recipe_local_id:
            existing = con.execute(
                "SELECT id,status,version FROM recipe_publications WHERE author_user_id=? AND recipe_local_id=? AND status!='archived' ORDER BY id DESC LIMIT 1",
                (user.id, body.recipe_local_id.strip()),
            ).fetchone()
        if not existing:
            existing = con.execute(
                "SELECT id,status,version FROM recipe_publications WHERE author_user_id=? AND lower(trim(title))=lower(trim(?)) AND status!='archived' ORDER BY id DESC LIMIT 1",
                (user.id, body.title.strip()),
            ).fetchone()
        if existing:
            row_id, from_status, old_version = existing
            version = int(old_version or 1) + 1
            notify_action = "resubmitted"
            slug = ensure_unique_slug(con, body.title, row_id)
            con.execute(
                "UPDATE recipe_publications SET recipe_local_id=?,source_draft_id=?,version=?,title=?,"
                "group_name=?,volume_ml=?,price=?,cost=?,recipe_json=?,validation_json=?,"
                "public_description=?,image_url=?,video_url=?,status='submitted',review_comment='',"
                "review_flags_json='[]',public_slug=?,published_at=NULL,updated_at=? "
                "WHERE id=? AND author_user_id=?",
                (
                    body.recipe_local_id.strip(), source_draft_id, version, body.title.strip(),
                    body.group_name.strip(), body.volume_ml, body.price, body.cost, recipe_json,
                    validation_json, body.public_description.strip(), image_url, video_url,
                    slug, now, row_id, user.id,
                ),
            )
            pub_id = row_id
        else:
            version = 1
            from_status = ""
            notify_action = "submitted"
            slug = ensure_unique_slug(con, body.title)
            cur = con.execute(
                "INSERT INTO recipe_publications(author_user_id,recipe_local_id,source_draft_id,version,"
                "title,group_name,volume_ml,price,cost,recipe_json,validation_json,public_description,"
                "image_url,video_url,status,public_slug,created_at,updated_at) "
                "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    user.id, body.recipe_local_id.strip(), source_draft_id, version,
                    body.title.strip(), body.group_name.strip(), body.volume_ml, body.price,
                    body.cost, recipe_json, validation_json, body.public_description.strip(),
                    image_url, video_url, "submitted", slug, now, now,
                ),
            )
            pub_id = cur.lastrowid
        _insert_publication_version(
            con, pub_id, version, recipe_json, body.public_description.strip(),
            image_url, video_url, body.price, body.cost, validation_json, now,
        )
        _insert_publication_event(
            con, pub_id, "author", user.id, "submitted", from_status or "",
            "submitted", version, "", [], now,
        )
        con.commit()
        _notify_author_review_team(con, pub_id, notify_action)
        return {"ok": True, "id": pub_id, "status": "submitted", "public_slug": slug, "version": version}
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()

@app.get("/api/public/author-recipes")
def public_author_recipes():
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    rows = con.execute(
        _select_publication_sql("WHERE status='published' ORDER BY published_at DESC, id DESC")
    ).fetchall()
    result = [public_publication_item(con, r) for r in rows]
    con.close()
    return result

@app.get("/api/public/author-recipes/meta")
def public_author_recipes_meta():
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    rows = con.execute(
        _select_publication_sql("WHERE status='published' ORDER BY published_at DESC, id DESC")
    ).fetchall()
    items = [public_publication_item(con, r) for r in rows]
    con.close()
    authors = {}
    categories = {}
    prices = []
    for item in items:
        author_name = (item.get("author") or {}).get("name") or "Moscow Barista School"
        authors[author_name] = authors.get(author_name, 0) + 1
        category = item.get("category") or "Авторские"
        categories[category] = categories.get(category, 0) + 1
        try:
            prices.append(float(item.get("price") or 0))
        except Exception:
            pass
    return {
        "authors": [{"name": k, "count": v} for k, v in sorted(authors.items())],
        "categories": [{"name": k, "count": v} for k, v in sorted(categories.items())],
        "price": {
            "min": min(prices) if prices else 0,
            "max": max(prices) if prices else 0,
        },
        "championships": [
            {
                "key": "mixology-cup",
                "title": "MBS MIXOLOGY CUP",
                "count": sum(1 for item in items if item.get("is_mixology")),
            }
        ],
    }

@app.get("/api/public/author-recipes/{slug}")
def public_author_recipe(slug: str):
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    row = con.execute(
        _select_publication_sql("WHERE status='published' AND (public_slug=? OR id=?)"),
        (slug, slug if slug.isdigit() else -1),
    ).fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    item = public_publication_item(con, row)
    related_rows = con.execute(
        _select_publication_sql(
            "WHERE status='published' AND author_user_id=? AND id<>? ORDER BY published_at DESC, id DESC LIMIT 4"
        ),
        (row[1], row[0]),
    ).fetchall()
    item["related"] = [public_publication_item(con, r) for r in related_rows]
    con.close()
    return item

@app.post("/api/public/author-recipes/{recipe_id}/order")
def create_recipe_order(recipe_id: int, body: RecipeOrderPayload):
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    row = con.execute(
        _select_publication_sql("WHERE id=? AND status='published'"),
        (recipe_id,),
    ).fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Рецепт не найден")
    pub = publication_row(row, include_private=False)
    bitrix_deal_id = ""
    status_value = "new"
    try:
        bitrix_deal_id = _push_recipe_order_to_bitrix(pub, body)
        if bitrix_deal_id:
            status_value = "sent_to_bitrix"
    except Exception as e:
        print(f"[bitrix recipe order] deal warning: {e}")
    con.execute(
        "INSERT INTO recipe_orders(publication_id,customer_name,customer_email,customer_phone,"
        "comment,source,status,bitrix_deal_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
        (
            recipe_id, body.customer_name.strip(), body.customer_email.strip(), body.customer_phone.strip(),
            body.comment.strip(), body.source.strip() or "barista-school.online",
            status_value, bitrix_deal_id, utc_now_iso(),
        ),
    )
    con.commit()
    con.close()
    return {"ok": True, "status": status_value}

@app.post("/api/public/author-recipes/cart-order")
def create_recipe_cart_order(body: RecipeCartOrderPayload):
    import sqlite3 as _sq
    recipe_ids = []
    for raw_id in body.recipe_ids or []:
        try:
            recipe_id = int(raw_id)
        except Exception:
            continue
        if recipe_id > 0 and recipe_id not in recipe_ids:
            recipe_ids.append(recipe_id)
    recipe_ids = recipe_ids[:20]
    if not recipe_ids:
        raise HTTPException(status_code=400, detail="Не выбраны рецепты")
    con = _sq.connect(app_db_path())
    placeholders = ",".join("?" for _ in recipe_ids)
    rows = con.execute(
        _select_publication_sql(f"WHERE status='published' AND id IN ({placeholders})"),
        recipe_ids,
    ).fetchall()
    if len(rows) != len(recipe_ids):
        con.close()
        raise HTTPException(status_code=404, detail="Один из рецептов не найден")
    pubs = [publication_row(row, include_private=False) for row in rows]
    title_lines = [
        f"- {pub.get('title')} — {float(pub.get('price') or 0):.0f} ₽"
        for pub in pubs
    ]
    cart_total = sum(float(pub.get("price") or 0) for pub in pubs)
    cart_comment = (
        f"Корзина авторских рецептов:\n"
        f"{chr(10).join(title_lines)}\n"
        f"Итого: {cart_total:.0f} ₽\n\n"
        f"Комментарий покупателя: {body.comment.strip()}"
    )
    created = []
    for pub in pubs:
        single_body = RecipeOrderPayload(
            customer_name=body.customer_name,
            customer_email=body.customer_email,
            customer_phone=body.customer_phone,
            comment=cart_comment,
            source=body.source or "baristaschool.ru/summer_drinks",
        )
        bitrix_deal_id = ""
        status_value = "new"
        try:
            bitrix_deal_id = _push_recipe_order_to_bitrix(pub, single_body)
            if bitrix_deal_id:
                status_value = "sent_to_bitrix"
        except Exception as e:
            print(f"[bitrix recipe cart order] deal warning: {e}")
        con.execute(
            "INSERT INTO recipe_orders(publication_id,customer_name,customer_email,customer_phone,"
            "comment,source,status,bitrix_deal_id,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
            (
                int(pub.get("id") or 0),
                body.customer_name.strip(),
                body.customer_email.strip(),
                body.customer_phone.strip(),
                cart_comment,
                body.source.strip() or "baristaschool.ru/summer_drinks",
                status_value,
                bitrix_deal_id,
                utc_now_iso(),
            ),
        )
        created.append({"status": status_value})
    con.commit()
    con.close()
    return {"ok": True, "orders": created, "count": len(created), "total": cart_total}

@app.get("/api/admin/authors")
def admin_list_authors(admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    rows = con.execute("""
        SELECT u.id,u.email,u.name,u.phone,u.access_author,p.id,p.public_name,p.document_status,
               p.mixology_participant_id,p.bitrix_contact_id,p.bitrix_sync_status,p.bitrix_sync_error,
               p.bitrix_synced_at,
               COUNT(r.id) AS recipes_count,
               SUM(CASE WHEN r.status='published' THEN 1 ELSE 0 END) AS published_count
        FROM users u
        LEFT JOIN author_profiles p ON p.user_id=u.id
        LEFT JOIN recipe_publications r ON r.author_user_id=u.id
        WHERE u.access_author=1 OR p.id IS NOT NULL OR r.id IS NOT NULL
        GROUP BY u.id
        ORDER BY u.created_at DESC
    """).fetchall()
    con.close()
    return [{
        "user_id": r[0], "email": r[1], "name": r[2], "phone": r[3] or "",
        "access_author": bool(r[4]), "profile_id": r[5], "public_name": r[6] or "",
        "document_status": r[7] or "not_started", "mixology_participant_id": r[8] or "",
        "bitrix_contact_id": r[9] or "", "bitrix_sync_status": r[10] or "",
        "bitrix_sync_error": r[11] or "", "bitrix_synced_at": r[12] or "",
        "recipes_count": r[13] or 0, "published_count": r[14] or 0,
    } for r in rows]

@app.get("/api/admin/author-recipes")
def admin_list_author_recipes(
    status: str = "",
    author_user_id: int = 0,
    q: str = "",
    admin: User = Depends(get_admin_user),
):
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    where = []
    values = []
    if status:
        where.append("status=?")
        values.append(status)
    if author_user_id:
        where.append("author_user_id=?")
        values.append(author_user_id)
    if q.strip():
        where.append("(lower(title) LIKE lower(?) OR lower(public_description) LIKE lower(?))")
        term = f"%{q.strip()}%"
        values.extend([term, term])
    extra = ("WHERE " + " AND ".join(where) + " " if where else "") + "ORDER BY updated_at DESC, id DESC"
    rows = con.execute(_select_publication_sql(extra), values).fetchall()
    result = []
    for r in rows:
        item = publication_row(r, include_private=True)
        _attach_author_to_publication(con, item)
        result.append(item)
    con.close()
    return result

@app.get("/api/admin/author-recipes/{pub_id}")
def admin_get_author_recipe(pub_id: int, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    con = _sq.connect(app_db_path())
    row = con.execute(_select_publication_sql("WHERE id=?"), (pub_id,)).fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Публикация не найдена")
    item = publication_row(row, include_private=True)
    _attach_author_to_publication(con, item)
    item["events"] = _publication_events(con, pub_id, limit=30)
    item["versions"] = _publication_versions(con, pub_id, limit=20)
    con.close()
    return item

@app.patch("/api/admin/author-recipes/{pub_id}")
def admin_update_author_recipe(pub_id: int, body: AdminPublicationPatch, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    allowed_status = {"submitted", "published", "rejected", "archived"}
    review_flags = [str(x).strip() for x in (body.review_flags or []) if str(x).strip()]
    review_comment = body.review_comment.strip()
    con = _sq.connect(app_db_path())
    row = con.execute(_select_publication_sql("WHERE id=?"), (pub_id,)).fetchone()
    if not row:
        con.close()
        raise HTTPException(status_code=404, detail="Публикация не найдена")
    item = publication_row(row, include_private=True)
    now = utc_now_iso()
    from_status = item["status"]
    version = int(item.get("version") or 1)
    new_price = body.price if body.price is not None else item["price"]
    new_description = body.public_description.strip() if body.public_description is not None else item["public_description"]
    validation_payload = RecipePublicationPayload(
        recipe_local_id=item["recipe_local_id"],
        title=item["title"],
        group_name=item["group_name"],
        volume_ml=int(item["volume_ml"] or 0),
        price=float(new_price or 0),
        cost=float(item["cost"] or 0),
        recipe=item.get("recipe") or {},
        public_description=new_description,
        image_url=item["image_url"],
        video_url=item["video_url"],
    )
    recipe_snapshot, validation = _normalize_author_recipe_snapshot(validation_payload, item["author_user_id"])
    validation_json = json.dumps(validation, ensure_ascii=False)
    if body.status is not None:
        if body.status not in allowed_status:
            con.close()
            raise HTTPException(status_code=400, detail="Недопустимый статус")
        if body.status == "rejected" and not review_comment and not review_flags:
            con.close()
            raise HTTPException(status_code=400, detail="Для доработки укажите комментарий или отметьте блоки чеклиста")
        if body.status == "published" and not validation["ok"]:
            con.close()
            raise HTTPException(status_code=400, detail={
                "message": "Нельзя опубликовать неполный рецепт",
                "missing": validation["missing"],
                "missing_labels": validation["missing_labels"],
            })
    try:
        updates = ["validation_json=?"]
        values = [validation_json]
        if body.status is not None:
            updates.append("status=?")
            values.append(body.status)
            if body.status == "published":
                updates.append("published_at=?")
                values.append(now)
                review_comment = ""
                review_flags = []
        updates.append("review_comment=?")
        values.append(review_comment)
        updates.append("review_flags_json=?")
        values.append(json.dumps(review_flags, ensure_ascii=False))
        if body.public_description is not None:
            updates.append("public_description=?")
            values.append(new_description)
        if body.price is not None:
            updates.append("price=?")
            values.append(new_price)
        if body.bitrix_product_name is not None:
            updates.append("bitrix_product_name=?")
            values.append(body.bitrix_product_name.strip())
        updates.append("updated_at=?")
        values.append(now)
        values.append(pub_id)
        con.execute("UPDATE recipe_publications SET " + ",".join(updates) + " WHERE id=?", values)
        event_type = "review_saved"
        if body.status == "published":
            event_type = "published"
        elif body.status == "rejected":
            event_type = "rejected"
        elif body.status == "archived":
            event_type = "archived"
        _insert_publication_event(
            con, pub_id, "admin", admin.id, event_type, from_status,
            body.status or from_status, version, review_comment, review_flags, now,
        )
        con.commit()
        if event_type in {"published", "rejected", "archived"} or (event_type == "review_saved" and (review_comment or review_flags)):
            _notify_author_publication_event(con, pub_id, event_type)
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()
    return {"ok": True}

# ── ADMIN ─────────────────────────────────────────────────────
@app.get("/api/admin/users")
def admin_list_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{"id": u.id, "email": u.email, "name": u.name, "phone": u.phone or "", "reg_source": u.reg_source or "email", "is_active": u.is_active, "is_admin": u.is_admin, "access": user_access(u), "access_drinks": user_access(u)["drinks"], "access_finance": user_access(u)["finance"], "access_author": user_access(u)["author"], "consent": bool(u.consent), "consent_at": u.consent_at.isoformat() if u.consent_at else None, "created_at": u.created_at.isoformat() if u.created_at else None, "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None, "notes": u.notes or "", "notes_updated_at": u.notes_updated_at.isoformat() if u.notes_updated_at else None} for u in users]

@app.post("/api/admin/activate/{user_id}")
def admin_activate(user_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    was_inactive = not user.is_active
    user.is_active = True
    db.commit()
    if was_inactive:
        send_activation_email(user.email, user.name)
    return {"ok": True, "email": user.email}

@app.post("/api/admin/deactivate/{user_id}")
def admin_deactivate(user_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Нельзя деактивировать admin")
    user.is_active = False
    db.commit()
    return {"ok": True}

@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.is_admin:
        raise HTTPException(status_code=400, detail="Нельзя удалить admin")
    email_to_notify = user.email
    name_to_notify  = user.name
    db.query(UserState).filter(UserState.user_id == user_id).delete()
    db.delete(user)
    db.commit()
    send_deletion_email(email_to_notify, name_to_notify)
    return {"ok": True}

@app.patch("/api/admin/users/{user_id}")
def admin_update_user(
    user_id: int,
    body: dict,
    background_tasks: BackgroundTasks,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    from pydantic import BaseModel as _BM
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    was_author = bool(user.access_author)
    if "is_active" in body:
        if not body["is_active"] and user.is_admin:
            raise HTTPException(status_code=400, detail="Нельзя деактивировать admin")
        user.is_active = bool(body["is_active"])
    if "is_admin" in body and not body["is_admin"] and user.email == ADMIN_EMAIL.lower():
        raise HTTPException(status_code=400, detail="Нельзя снять флаг admin у главного администратора")
    if "is_admin" in body:
        user.is_admin = bool(body["is_admin"])
    if "notes" in body:
        user.notes = str(body["notes"]) if body["notes"] else None
        user.notes_updated_at = datetime.utcnow() if body["notes"] else None
    if "access_drinks" in body:
        user.access_drinks = bool(body["access_drinks"])
    if "access_finance" in body:
        user.access_finance = bool(body["access_finance"])
    if "access_author" in body:
        user.access_author = bool(body["access_author"])
    db.commit()
    if "access_author" in body and bool(user.access_author) and not was_author:
        _queue_author_bitrix_sync(user.id, background_tasks)
    return {"ok": True, "id": user.id, "is_active": user.is_active, "is_admin": user.is_admin, "access": user_access(user), "access_drinks": user_access(user)["drinks"], "access_finance": user_access(user)["finance"], "access_author": user_access(user)["author"], "notes_updated_at": user.notes_updated_at.isoformat() if user.notes_updated_at else None}

@app.post("/api/admin/authors/{user_id}/sync-bitrix")
def admin_sync_author_bitrix(
    user_id: int,
    background_tasks: BackgroundTasks,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if not user.access_author and not user.is_admin:
        raise HTTPException(status_code=400, detail="Пользователю не выдан доступ автора")
    _queue_author_bitrix_sync(user.id, background_tasks)
    return {"ok": True, "status": "pending"}

# ── PASSWORD RESET ───────────────────────────────────────────
@app.post("/api/auth/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
        db.commit()
        if body.source == "admin":
            login_url = "https://baristaschool.online/#adm"
        else:
            login_url = "https://barista-school.online"
        reset_url = f"{APP_URL}/?reset_token={urllib.parse.quote(token)}"
        email_sent = send_password_reset_email(user.email, reset_url, user.name, login_url)
        if not email_sent:
            print(f"[security] SMTP failed for user_id={user.id}; reset link NOT returned in response")
            return {"ok": True, "email_sent": False}
    # Всегда отвечаем одинаково (защита от перебора email)
    return {"ok": True, "email_sent": True}

@app.post("/api/auth/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not body.token or len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Пароль должен быть минимум 8 символов")
    user = db.query(User).filter(User.reset_token == body.token).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Ссылка недействительна или истекла")
    user.password_hash = hash_password(body.password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"ok": True, "message": "Пароль успешно изменён"}

# ── YANDEX OAUTH ─────────────────────────────────────────────
@app.get("/api/auth/yandex")
def yandex_oauth_start():
    """Редиректим пользователя на страницу авторизации Яндекса."""
    from fastapi.responses import RedirectResponse
    import urllib.parse
    params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": YANDEX_CLIENT_ID,
        "redirect_uri": YANDEX_REDIRECT,
    })
    return RedirectResponse(f"https://oauth.yandex.ru/authorize?{params}")

@app.get("/api/auth/yandex/callback")
def yandex_oauth_callback(code: str = None, error: str = None, db: Session = Depends(get_db)):
    """Яндекс редиректит сюда с кодом. Меняем код на токен, получаем профиль."""
    from fastapi.responses import RedirectResponse
    import urllib.request, urllib.parse, json as _json
    if error or not code:
        return RedirectResponse(f"{APP_URL}/?auth_error=yandex_denied")
    # 1. Меняем code → access_token
    try:
        data = urllib.parse.urlencode({
            "grant_type": "authorization_code",
            "code": code,
            "client_id": YANDEX_CLIENT_ID,
            "client_secret": YANDEX_SECRET,
            "redirect_uri": YANDEX_REDIRECT,
        }).encode()
        req = urllib.request.Request("https://oauth.yandex.ru/token", data=data)
        with urllib.request.urlopen(req, timeout=10) as resp:
            token_data = _json.loads(resp.read())
        ya_token = token_data.get("access_token", "")
        if not ya_token:
            raise ValueError("no token")
        # 2. Получаем профиль пользователя
        req2 = urllib.request.Request(
            "https://login.yandex.ru/info?format=json",
            headers={"Authorization": f"OAuth {ya_token}"}
        )
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            profile = _json.loads(resp2.read())
        ya_email = (profile.get("default_email") or "").lower().strip()
        ya_name  = profile.get("real_name") or profile.get("display_name") or ya_email.split("@")[0]
        ya_phone = ""
        default_phone = profile.get("default_phone") or {}
        if isinstance(default_phone, dict):
            ya_phone = default_phone.get("number", "")
        elif profile.get("phones"):
            ya_phone = (profile["phones"][0] or {}).get("number", "")
        if not ya_email:
            raise ValueError("no email")
        # 3. Найти или создать пользователя
        user = db.query(User).filter(User.email == ya_email).first()
        is_new_user = False
        if not user:
            is_new_user = True
            user = User(
                email=ya_email,
                name=ya_name,
                password_hash=hash_password(secrets.token_urlsafe(16)),
                is_active=False,
                is_admin=False,
                phone=ya_phone or None,
                reg_source="yandex",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            notify_admin_new_user(user.id, user.email, user.name, phone=ya_phone, source="yandex")
        if not user.is_active:
            return RedirectResponse(f"{APP_URL}/?auth_error=account_inactive")
        # 4. Генерируем JWT и передаём его через одноразовый exchange-code, а не query string.
        jwt_token = create_token(user.id)
        exchange_code = _create_oauth_exchange(jwt_token, user_public_payload(user))
        return RedirectResponse(f"{APP_URL}/?oauth_code={urllib.parse.quote(exchange_code)}")
    except Exception as e:
        print(f"[yandex oauth] error: {e}")
        return RedirectResponse(f"{APP_URL}/?auth_error=yandex_failed")

@app.post("/api/auth/oauth-exchange")
def oauth_exchange(body: OAuthExchangeRequest):
    item = _consume_oauth_exchange(body.code)
    if not item or not item.get("token") or not item.get("user"):
        raise HTTPException(status_code=400, detail="OAuth-сессия истекла. Попробуйте войти снова.")
    return {"ok": True, "token": item["token"], "user": item["user"]}

@app.post("/api/admin/users/{user_id}/reset-link")
def admin_reset_link(user_id: int, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.commit()
    reset_url = f"{APP_URL}/?reset_token={token}"
    return {"ok": True, "reset_url": reset_url, "expires_hours": 24}

# ── Health ────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"ok": True, "version": "1.0.0"}

# ── Библиотека оборудования — публичный эндпоинт ─────────────
@app.get("/api/oc-library")
def oc_library(category: str = None):
    """Возвращает библиотеку из таблицы oc_library, сгруппированную по подкатегориям. Опционально фильтрует по category."""
    import sqlite3 as _sqlite3
    DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sqlite3.connect(DB_PATH)
        if category:
            rows = con.execute(
                "SELECT name, subcategory, price, photo, url, is_featured, sort_order, description, promo_code, promo_expires FROM oc_library WHERE category=? AND is_public=1 ORDER BY subcategory, sort_order ASC, is_featured DESC, name",
                (category,)
            ).fetchall()
        else:
            rows = con.execute(
                "SELECT name, subcategory, price, photo, url, is_featured, sort_order, description, promo_code, promo_expires FROM oc_library WHERE is_public=1 ORDER BY subcategory, sort_order ASC, is_featured DESC, name"
            ).fetchall()
        con.close()
        result = {}
        for name, subcat, price, photo, url, is_featured, sort_order, description, promo_code, promo_expires in rows:
            cat = (subcat or 'Другое').strip() or 'Другое'
            result.setdefault(cat, []).append({
                'name':         name,
                'price':        price,
                'photo':        photo or '',
                'url':          url or '',
                'is_featured':  is_featured or 0,
                'sort_order':   sort_order or 0,
                'description':  description or '',
                'promo_code':   promo_code or '',
                'promo_expires': promo_expires or '',
            })
        return result
    except Exception as e:
        return {"_error": str(e)}

# ── OC-LIBRARY ADMIN CRUD ──────────────────────────────────────
class OcLibraryItem(BaseModel):
    name: str
    subcategory: str
    price: float = 0.0
    photo: str = ''
    url: str = ''
    category: str = 'equipment'
    is_public: int = 1
    is_featured: int = 0
    sort_order: int = 0
    description: str = ''
    promo_code: str = ''
    promo_expires: str = ''

class OcBulkDelete(BaseModel):
    ids: list

@app.get("/api/admin/oc-library")
def admin_get_oc_library(admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        rows = con.execute("SELECT rowid, name, subcategory, price, photo, url, category, is_public, is_featured, sort_order, description, promo_code, promo_expires FROM oc_library ORDER BY category, sort_order ASC, subcategory, name").fetchall()
        con.close()
        return [{'id': r[0], 'name': r[1], 'subcategory': r[2] or 'Другое', 'price': r[3], 'photo': r[4] or '', 'url': r[5] or '', 'category': r[6] or 'equipment', 'is_public': r[7] if r[7] is not None else 1, 'is_featured': r[8] or 0, 'sort_order': r[9] or 0, 'description': r[10] or '', 'promo_code': r[11] or '', 'promo_expires': r[12] or ''} for r in rows]
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/admin/oc-library")
def admin_create_oc_item(item: OcLibraryItem, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        cur = con.execute("INSERT INTO oc_library (name, subcategory, price, photo, url, category, is_public, is_featured, sort_order, description, promo_code, promo_expires) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            (item.name.strip(), item.subcategory.strip(), item.price, item.photo.strip(), item.url.strip(), item.category.strip() or 'equipment', item.is_public, item.is_featured, item.sort_order, item.description.strip(), item.promo_code.strip(), item.promo_expires.strip()))
        new_id = cur.lastrowid
        con.commit(); con.close()
        return {'ok': True, 'id': new_id}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.put("/api/admin/oc-library/{item_id}")
def admin_update_oc_item(item_id: int, item: OcLibraryItem, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        con.execute("UPDATE oc_library SET name=?,subcategory=?,price=?,photo=?,url=?,category=?,is_public=?,is_featured=?,sort_order=?,description=?,promo_code=?,promo_expires=? WHERE rowid=?",
            (item.name.strip(), item.subcategory.strip(), item.price, item.photo.strip(), item.url.strip(), item.category.strip() or 'equipment', item.is_public, item.is_featured, item.sort_order, item.description.strip(), item.promo_code.strip(), item.promo_expires.strip(), item_id))
        con.commit(); con.close()
        return {'ok': True}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/api/admin/oc-library/{item_id}")
def admin_delete_oc_item(item_id: int, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        con.execute("DELETE FROM oc_library WHERE rowid=?", (item_id,))
        con.commit(); con.close()
        return {'ok': True}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/admin/oc-library/bulk-delete")
def admin_bulk_delete_oc(body: OcBulkDelete, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    if not body.ids:
        return {'ok': True}
    try:
        con = _sq.connect(_db)
        ph = ','.join('?' * len(body.ids))
        con.execute(f"DELETE FROM oc_library WHERE rowid IN ({ph})", body.ids)
        con.commit(); con.close()
        return {'ok': True}
    except Exception as e:
        raise HTTPException(500, str(e))

# ── SUP-LIBRARY ─────────────────────────────────────────────────
class SupplierItem(BaseModel):
    name: str
    phone: str = ''
    site: str = ''
    note: str = ''
    logo_url: str = ''
    is_public: int = 1
    is_featured: int = 0
    sort_order: int = 0
    promo_code: str = ''
    promo_expires: str = ''
    promo_desc: str = ''
    tags: str = ''

def _sup_row(r):
    return {
        'id': r[0], 'name': r[1], 'phone': r[2] or '', 'site': r[3] or '',
        'note': r[4] or '', 'logo_url': r[5] or '',
        'is_public': r[6] if r[6] is not None else 1,
        'is_featured': r[7] or 0, 'sort_order': r[8] or 0,
        'promo_code': r[9] or '', 'promo_expires': r[10] or '',
        'promo_desc': r[11] or '', 'tags': r[12] or ''
    }

@app.get("/api/suppliers")
def get_suppliers_public(user: User = Depends(get_current_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    con = _sq.connect(_db); con.row_factory = _sq.Row
    rows = con.execute(
        "SELECT rowid,name,phone,site,note,logo_url,is_public,is_featured,sort_order,"
        "promo_code,promo_expires,promo_desc,tags FROM sup_library "
        "WHERE is_public=1 ORDER BY sort_order, name"
    ).fetchall()
    con.close()
    return [_sup_row(tuple(r)) for r in rows]

@app.get("/api/admin/suppliers")
def admin_get_suppliers(admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    con = _sq.connect(_db); con.row_factory = _sq.Row
    rows = con.execute(
        "SELECT rowid,name,phone,site,note,logo_url,is_public,is_featured,sort_order,"
        "promo_code,promo_expires,promo_desc,tags FROM sup_library ORDER BY sort_order, name"
    ).fetchall()
    con.close()
    return [_sup_row(tuple(r)) for r in rows]

@app.post("/api/admin/suppliers")
def admin_create_supplier(body: SupplierItem, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        cur = con.execute(
            "INSERT INTO sup_library(name,phone,site,note,logo_url,is_public,is_featured,"
            "sort_order,promo_code,promo_expires,promo_desc,tags) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            (body.name, body.phone, body.site, body.note, body.logo_url,
             body.is_public, body.is_featured, body.sort_order,
             body.promo_code, body.promo_expires, body.promo_desc, body.tags)
        )
        new_id = cur.lastrowid; con.commit(); con.close()
        return {'ok': True, 'id': new_id}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.put("/api/admin/suppliers/{item_id}")
def admin_update_supplier(item_id: int, body: SupplierItem, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        con.execute(
            "UPDATE sup_library SET name=?,phone=?,site=?,note=?,logo_url=?,is_public=?,"
            "is_featured=?,sort_order=?,promo_code=?,promo_expires=?,promo_desc=?,tags=? "
            "WHERE rowid=?",
            (body.name, body.phone, body.site, body.note, body.logo_url,
             body.is_public, body.is_featured, body.sort_order,
             body.promo_code, body.promo_expires, body.promo_desc, body.tags, item_id)
        )
        con.commit(); con.close()
        return {'ok': True}
    except Exception as e:
        raise HTTPException(500, str(e))

@app.delete("/api/admin/suppliers/{item_id}")
def admin_delete_supplier(item_id: int, admin: User = Depends(get_admin_user)):
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        con.execute("DELETE FROM sup_library WHERE rowid=?", (item_id,))
        con.commit(); con.close()
        return {'ok': True}
    except Exception as e:
        raise HTTPException(500, str(e))

# ── OC-PRESETS ——————————————————————————————————————————————————
class OcPresetSaveItem(BaseModel):
    lib_item_id: int
    qty: int = 1

class OcPresetSaveBody(BaseModel):
    items: list

@app.get("/api/oc-presets/{format}")
def get_oc_preset(format: str):
    """Публичный endpoint — возвращает пресет с полными данными из oc_library (JOIN)."""
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        rows = con.execute("""
            SELECT p.qty, p.sort_order,
                   l.rowid, l.name, l.subcategory, l.price, l.photo, l.url,
                   l.category, l.is_featured, l.description, l.promo_code, l.promo_expires
            FROM oc_presets p
            JOIN oc_library l ON l.rowid = p.lib_item_id
            WHERE p.format = ? AND l.is_public = 1
            ORDER BY p.sort_order ASC, l.name
        """, (format,)).fetchall()
        con.close()
        return [{'qty': r[0], 'sort_order': r[1], 'lib_item_id': r[2],
                 'name': r[3], 'subcategory': r[4] or '', 'price': r[5] or 0,
                 'photo': r[6] or '', 'url': r[7] or '',
                 'category': r[8] or 'equipment', 'is_featured': r[9] or 0,
                 'description': r[10] or '', 'promo_code': r[11] or '',
                 'promo_expires': r[12] or ''} for r in rows]
    except Exception as e:
        raise HTTPException(500, str(e))

@app.get("/api/admin/oc-presets/{format}")
def admin_get_oc_preset(format: str, admin: User = Depends(get_admin_user)):
    """Админский endpoint — возвращает пресет + lib_item_id для редактирования."""
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    try:
        con = _sq.connect(_db)
        rows = con.execute("""
            SELECT p.lib_item_id, p.qty, p.sort_order,
                   l.name, l.subcategory, l.price, l.photo, l.url, l.category, l.is_featured
            FROM oc_presets p
            JOIN oc_library l ON l.rowid = p.lib_item_id
            WHERE p.format = ?
            ORDER BY p.sort_order ASC, l.name
        """, (format,)).fetchall()
        con.close()
        return [{'lib_item_id': r[0], 'qty': r[1], 'sort_order': r[2],
                 'name': r[3], 'subcategory': r[4] or '', 'price': r[5] or 0,
                 'photo': r[6] or '', 'url': r[7] or '',
                 'category': r[8] or 'equipment', 'is_featured': r[9] or 0} for r in rows]
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/api/admin/oc-presets/{format}")
def admin_save_oc_preset(format: str, body: OcPresetSaveBody, admin: User = Depends(get_admin_user)):
    """Заменяет пресет целиком (DELETE + INSERT)."""
    import sqlite3 as _sq
    _db = os.path.join(os.path.dirname(__file__), 'data', 'app.db')
    if format not in ('kiosk', 'island', 'full'):
        raise HTTPException(400, 'Unknown format')
    try:
        con = _sq.connect(_db)
        con.execute("DELETE FROM oc_presets WHERE format=?", (format,))
        for i, item in enumerate(body.items):
            lib_item_id = item.get('lib_item_id') if isinstance(item, dict) else item.lib_item_id
            qty = item.get('qty', 1) if isinstance(item, dict) else getattr(item, 'qty', 1)
            con.execute(
                "INSERT INTO oc_presets (format, lib_item_id, qty, sort_order) VALUES (?,?,?,?)",
                (format, lib_item_id, int(qty or 1), i * 10)
            )
        con.commit(); con.close()
        return {'ok': True}
    except Exception as e:
        raise HTTPException(500, str(e))

class ParseUrlRequest(BaseModel):
    url: str

def _is_safe_proxy_meta_url(url: str) -> bool:
    """Allow only public HTTP(S) URLs; block localhost/private network SSRF targets."""
    import ipaddress
    import socket
    import urllib.parse as _up
    parsed = _up.urlparse((url or "").strip())
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        return False
    if parsed.username or parsed.password:
        return False
    if parsed.port and parsed.port not in (80, 443):
        return False
    host = parsed.hostname.strip().lower().rstrip(".")
    if host in ("localhost",) or host.endswith(".local"):
        return False
    try:
        addresses = socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)
    except socket.gaierror:
        return False
    for item in addresses:
        ip = ipaddress.ip_address(item[4][0])
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
            return False
    return True

@app.post("/api/admin/parse-url")
def admin_parse_url(body: ParseUrlRequest, admin: User = Depends(get_admin_user)):
    """AI-автозаполнение карточки оборудования по URL товара."""
    try:
        result = proxy_meta(body.url)
        name = result.get('og_title', '') or result.get('title', '')
        photo = result.get('og_image', '') or result.get('image', '')
        prices = result.get('prices', [])
        price = prices[0] if prices else (result.get('price', 0) or 0)
        return {
            'name': name,
            'photo': photo,
            'price': price,
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# ── URL Proxy — для AI-заполнения карточки (извлечение og:image, цены) ──
@app.get("/api/proxy-meta")
def proxy_meta(url: str):
    """Загружает страницу и возвращает og:image, og:title, prices — без CORS-проблем."""
    import urllib.request as ur
    import urllib.parse as _up
    import http.cookiejar as _cj
    import re as _re
    try:
        url = (url or '').strip()
        if not _is_safe_proxy_meta_url(url):
            raise HTTPException(status_code=400, detail="URL недоступен для автозаполнения")

        class _SafeRedirectHandler(ur.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                target = _up.urljoin(req.full_url, newurl)
                if not _is_safe_proxy_meta_url(target):
                    raise HTTPException(status_code=400, detail="Редирект ведёт на недоступный URL")
                return super().redirect_request(req, fp, code, msg, headers, newurl)

        _UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124'
        jar = _cj.CookieJar()
        opener = ur.build_opener(_SafeRedirectHandler(), ur.HTTPCookieProcessor(jar))

        req = ur.Request(url, headers={
            'User-Agent': _UA,
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'ru-RU,ru;q=0.9',
        })
        with opener.open(req, timeout=8) as r:
            raw = r.read(300_000)
            charset = r.headers.get_content_charset() or 'utf-8'
        html = raw.decode(charset, errors='replace')

        def get_meta(prop):
            q = '''["']'''
            p1 = r'<meta[^>]+property=' + q + prop + q + r'[^>]+content=' + q + r'([^"\']+)'
            p2 = r'<meta[^>]+content=' + q + r'([^"\']+)' + q + r'[^>]+property=' + q + prop + q
            p3 = r'<meta[^>]+name=' + q + prop + q + r'[^>]+content=' + q + r'([^"\']+)'
            m = _re.search(p1, html, _re.I) or _re.search(p2, html, _re.I) or _re.search(p3, html, _re.I)
            return m.group(1).strip() if m else ''

        og_image = get_meta('og:image')

        # Если og:image не найден или это явная заглушка-логотип — ищем альтернативы
        def _is_placeholder(u):
            if not u: return True
            low = u.lower()
            return any(x in low for x in ['-share.', 'og-default', 'logo', 'placeholder',
                                           'noimage', 'no-image', 'nophoto', '/og/'])

        def _fix_url(u, base_url):
            """Нормализует //cdn... → https://cdn..., /path → https://host/path"""
            if not u: return ''
            if u.startswith('//'):
                return 'https:' + u
            if u.startswith('/'):
                import urllib.parse as _up
                p = _up.urlparse(base_url)
                return f'{p.scheme}://{p.netloc}{u}'
            return u

        if _is_placeholder(og_image):
            # <img itemprop="image" src="...">
            m_img = _re.search(r'<img[^>]+itemprop=["\']image["\'][^>]+src=["\']([^"\']+)["\']', html, _re.I) \
                 or _re.search(r'<img[^>]+src=["\']([^"\']+)["\'][^>]+itemprop=["\']image["\']', html, _re.I)
            if m_img:
                og_image = _fix_url(m_img.group(1), url)
            else:
                # <link rel="image_src" href="...">
                m_link = _re.search(r'<link[^>]+rel=["\']image_src["\'][^>]+href=["\']([^"\']+)["\']', html, _re.I)
                if m_link:
                    og_image = _fix_url(m_link.group(1), url)

            # Fallback: первая <img src="..."> из /upload/ или /images/catalog/ путей
            # Предпочитаем большой размер (800_800 / big / large), иначе первый найденный
            if not og_image:
                upload_imgs = _re.findall(
                    r'<img[^>]+src=["\']([^"\']*(?:/upload/|/images/catalog/|/catalog/images/)[^"\']+\.(?:jpg|jpeg|png|webp))["\']',
                    html, _re.I
                )
                if upload_imgs:
                    big = next((u for u in upload_imgs if _re.search(r'800|big|large|full|main', u, _re.I)), None)
                    og_image = _fix_url(big or upload_imgs[0], url)
        else:
            og_image = _fix_url(og_image, url)

        og_title = get_meta('og:title')
        description = get_meta('og:description') or get_meta('description')
        if not og_title:
            t = _re.search(r'<title[^>]*>([^<]+)', html, _re.I)
            og_title = t.group(1).strip() if t else ''

        # Цена: ищем числа 4-7 цифр рядом с ₽/руб + JSON-LD + data-price
        # Исключаем промо-контекст: скидка/акция/экономия/от X ₽ в месяц
        PROMO_RE = _re.compile(r'(?:скидк|акци|экономи|бесплатн|рассрочк|в\s+месяц|от\s+\d)', _re.I)
        price_candidates = []

        # ── Стратегия 0: число + HTML-тег + ₽/руб (vasko.ru и подобные) ──
        # Пример: 7 050<span class="rubble">₽</span>
        for m in _re.finditer(r'(\d[\d\s\u00a0]{2,6}\d)\s*<[^>]{0,60}>\s*(?:₽|руб)', html, _re.I):
            ctx = html[max(0, m.start()-80):m.start()]
            if PROMO_RE.search(ctx):
                continue
            n = int(_re.sub(r'\D', '', m.group(1)))
            if 500 <= n <= 9_999_999:
                price_candidates.append(n)

        for m in _re.finditer(r'(\d[\d\s\u00a0]{2,6}\d)\s*(?:₽|руб)', html, _re.I):
            ctx = html[max(0, m.start()-60):m.start()]
            if PROMO_RE.search(ctx):
                continue
            n = int(_re.sub(r'\D', '', m.group(1)))
            if 500 <= n <= 9_999_999:
                price_candidates.append(n)
        for m in _re.finditer(r'"price"\s*:\s*"?(\d+)"?', html):
            n = int(m.group(1))
            if 500 <= n <= 9_999_999:
                price_candidates.append(n)
        for m in _re.finditer(r'data-price=["\']+(\d+)["\']', html):
            n = int(m.group(1))
            if 500 <= n <= 9_999_999:
                price_candidates.append(n)
        # itemprop price (только если > 0)
        for m in _re.finditer(r'itemprop=["\']price["\'][^>]*content=["\']([\d.]+)["\']', html, _re.I):
            try:
                n = int(float(m.group(1)))
                if 500 <= n <= 9_999_999:
                    price_candidates.append(n)
            except Exception:
                pass
        for m in _re.finditer(r'content=["\']([\d.]+)["\'][^>]*itemprop=["\']price["\']', html, _re.I):
            try:
                n = int(float(m.group(1)))
                if 500 <= n <= 9_999_999:
                    price_candidates.append(n)
            except Exception:
                pass

        # ── Стратегия 2: цены в JS-переменных внутри <script> ──────────
        # Ищем: price: 5000, "price":5000, 'price': 5000, currentPrice = 5000 и т.п.
        import json as _json
        for m in _re.finditer(
            r'["\']?(?:price|cost|currentPrice|basePrice|finalPrice|priceValue|item_price)'
            r'["\']?\s*[=:]\s*["\']?(\d[\d\s\u00a0]*\d|\d+)["\']?',
            html, _re.I
        ):
            try:
                n = int(_re.sub(r'\D', '', m.group(1)))
                if 500 <= n <= 9_999_999:
                    price_candidates.append(n)
            except Exception:
                pass

        # ── Стратегия 3: для OpenCart — POST cart/add с сессионным cookie ──
        # Запускаем всегда при наличии product_id; найденная цена добавляется ×3 (приоритет)
        m_pid = _re.search(r'product_id[=\'":\s]+(\d+)', html)
        if m_pid:
            pid = m_pid.group(1)
            parsed_url = _up.urlparse(url)
            base_url = f'{parsed_url.scheme}://{parsed_url.netloc}'
            try:
                # opener уже имеет session cookie с первого запроса
                post_data = f'product_id={pid}&quantity=1'.encode()
                req2 = ur.Request(
                    f'{base_url}/index.php?route=checkout/cart/add',
                    data=post_data,
                    headers={
                        'User-Agent': _UA,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Referer': url,
                    }
                )
                with opener.open(req2, timeout=5) as r2:
                    resp = r2.read(10_000).decode('utf-8', errors='replace')
                # {"success":"...","total":"Товаров: 1 (5 000.00р.)"}
                # Ответ может содержать \uXXXX unicode-escapes — парсим через json.loads
                import json as _json
                try:
                    rj = _json.loads(resp)
                    search_str = rj.get('total', '') + ' ' + rj.get('success', '')
                except Exception:
                    search_str = resp
                tm = _re.search(r'\((\d[\d\s\u00a0,.]*\d)\s*(?:р\.|руб|\u20bd)', search_str, _re.I)
                if tm:
                    n = int(_re.sub(r'\D', '', tm.group(1).split('.')[0]))
                    if 500 <= n <= 9_999_999:
                        # ×3 чтобы перевесить мусорные кандидаты из стратегий 1-2
                        price_candidates.extend([n, n, n])
                else:
                    for nm in _re.finditer(r'"(\d{4,7})"', search_str):
                        n = int(nm.group(1))
                        if 500 <= n <= 9_999_999:
                            price_candidates.extend([n, n, n])
            except Exception:
                pass

        # ── Стратегия 4: Bitrix — iblock/element AJAX ──────────────────
        if not price_candidates:
            for m in _re.finditer(
                r'(?:PRICE|CATALOG_PRICE)[_\w]*["\s:=]+(\d[\d\s\u00a0]{2,6}\d)',
                html, _re.I
            ):
                n = int(_re.sub(r'\D', '', m.group(1)))
                if 500 <= n <= 9_999_999:
                    price_candidates.append(n)

        # Уникальные, отсортированные по частоте
        from collections import Counter
        price_top = [p for p, _ in Counter(price_candidates).most_common(5)]

        return {
            "ok": True,
            "og_image": og_image,
            "og_title": og_title,
            "description": description[:300] if description else '',
            "prices": price_top,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}

# ── Telegram webhook ──────────────────────────────────────────
@app.post("/api/telegram/join-mbs/webhook")
async def join_mbs_tg_webhook(request: Request, db: Session = Depends(get_db)):
    """Привязка авторов и клиентское меню для @MBS_work_bot."""
    if JOIN_MBS_WEBHOOK_SECRET:
        header_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if not secrets.compare_digest(header_secret, JOIN_MBS_WEBHOOK_SECRET):
            raise HTTPException(status_code=403, detail="Forbidden")
    try:
        data = await request.json()
    except Exception:
        return {"ok": True}

    cb = data.get("callback_query") or {}
    if cb:
        cb_id = cb.get("id")
        action = (cb.get("data") or "").strip()
        chat_id = cb.get("message", {}).get("chat", {}).get("id") or cb.get("from", {}).get("id")
        if cb_id:
            _join_tg_call("answerCallbackQuery", {"callback_query_id": cb_id})
        if chat_id and action.startswith("mbs:"):
            _join_handle_menu_action(chat_id, action)
        return {"ok": True}

    msg = data.get("message") or {}
    text = (msg.get("text") or "").strip()
    chat_id = msg.get("chat", {}).get("id") or msg.get("from", {}).get("id")
    if not text:
        return {"ok": True}

    parts = text.split(maxsplit=1) if text.startswith("/start") else []
    payload = parts[1].strip() if len(parts) > 1 else ""
    if text.startswith("/start") and not payload:
        if chat_id:
            _join_send_main_menu(chat_id)
        return {"ok": True}
    if text in ("/main", "Главное меню", "Меню"):
        if chat_id:
            _join_send_main_menu(chat_id)
        return {"ok": True}
    if text in ("/courses", "Курсы", "🎓 Курсы"):
        if chat_id:
            _join_send_courses_menu(chat_id)
        return {"ok": True}
    if text in ("/gift", "Подарочные сертификаты", "🎁 Подарочные сертификаты"):
        if chat_id:
            _join_handle_menu_action(chat_id, "mbs:menu:gifts")
        return {"ok": True}
    if text in ("/events", "События", "📅 События"):
        if chat_id:
            _join_handle_menu_action(chat_id, "mbs:menu:events")
        return {"ok": True}
    if text in ("/contacts", "Контакты", "📞 Контакты"):
        if chat_id:
            _join_handle_menu_action(chat_id, "mbs:menu:contacts")
        return {"ok": True}
    if text in ("/question", "/manager", "Задать вопрос", "💬 Задать вопрос"):
        if chat_id:
            _join_handle_menu_action(chat_id, "mbs:menu:question")
        return {"ok": True}
    if not payload.startswith("author_"):
        return {"ok": True}

    token = payload[len("author_"):].strip()
    username = (msg.get("from", {}).get("username") or msg.get("chat", {}).get("username") or "").strip()
    if not token or not chat_id:
        return {"ok": True}

    import sqlite3 as _sq
    now = utc_now_iso()
    con = _sq.connect(app_db_path())
    try:
        token_row = con.execute(
            "SELECT token,user_id,expires_at,used_at FROM author_telegram_link_tokens WHERE token=?",
            (token,),
        ).fetchone()
        if not token_row:
            _join_tg_send(chat_id, "Ссылка для подключения Telegram не найдена. Создайте новую ссылку в кабинете автора.")
            return {"ok": True}
        if token_row[3]:
            _join_tg_send(chat_id, "Эта ссылка уже использована. Создайте новую ссылку в кабинете автора.")
            return {"ok": True}
        try:
            expires_at = datetime.fromisoformat(token_row[2])
        except Exception:
            expires_at = datetime.utcnow() - timedelta(seconds=1)
        if expires_at < datetime.utcnow():
            _join_tg_send(chat_id, "Ссылка для подключения Telegram устарела. Создайте новую ссылку в кабинете автора.")
            return {"ok": True}
        user = db.query(User).filter(User.id == int(token_row[1])).first()
        if not user or not user.access_author:
            _join_tg_send(chat_id, "Telegram можно подключить только к активному кабинету автора.")
            return {"ok": True}
        row = con.execute("SELECT id FROM author_profiles WHERE user_id=?", (user.id,)).fetchone()
        if not row:
            _ensure_author_profile_for_user(con, user, status="pending")
        con.execute(
            "UPDATE author_profiles SET telegram_chat_id=?,telegram_username=?,telegram_bound_at=?,"
            "telegram_notify_enabled=1,updated_at=? WHERE user_id=?",
            (str(chat_id), username, now, now, user.id),
        )
        con.execute("UPDATE author_telegram_link_tokens SET used_at=? WHERE token=?", (now, token))
        con.commit()
        username_text = f" @{username}" if username else ""
        _join_tg_send(chat_id, f"Telegram подключён{username_text}. Теперь сюда будут приходить уведомления по проверке рецептов.")
    except Exception as e:
        con.rollback()
        print(f"[join_mbs_bot] webhook warning: {e}")
        if chat_id:
            _join_tg_send(chat_id, "Не удалось подключить Telegram. Попробуйте создать новую ссылку в кабинете автора.")
    finally:
        con.close()
    return {"ok": True}

@app.post("/api/telegram/webhook")
async def tg_webhook(request: Request, db: Session = Depends(get_db)):
    """Получает callback от Telegram при нажатии кнопок."""
    if TELEGRAM_WEBHOOK_SECRET:
        header_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if not secrets.compare_digest(header_secret, TELEGRAM_WEBHOOK_SECRET):
            raise HTTPException(status_code=403, detail="Forbidden")
    try:
        data = await request.json()
    except Exception:
        return {"ok": True}

    cb = data.get("callback_query")
    if not cb:
        return {"ok": True}

    cb_id   = cb.get("id")
    chat_id = cb.get("from", {}).get("id")
    payload = cb.get("data", "")
    msg_id  = cb.get("message", {}).get("message_id")

    if not TG_ADMIN_CHAT or str(chat_id) != str(TG_ADMIN_CHAT):
        return {"ok": True}

    # Отвечаем на callback сразу (убирает часики в Telegram)
    _tg_call("answerCallbackQuery", {"callback_query_id": cb_id})

    if "_" not in payload:
        return {"ok": True}

    action, uid_str = payload.split("_", 1)
    try:
        uid = int(uid_str)
    except ValueError:
        return {"ok": True}

    user = db.query(User).filter(User.id == uid).first()
    if not user:
        _tg_call("sendMessage", {"chat_id": chat_id, "text": f"⚠️ Пользователь #{uid} не найден"})
        return {"ok": True}

    if action == "activate":
        was_inactive = not user.is_active
        user.is_active = True
        db.commit()
        if was_inactive:
            send_activation_email(user.email, user.name)
        reply = f"✅ *{user.name}* (`{user.email}`) активирован — письмо отправлено"
    elif action == "reject":
        was_active = user.is_active
        user.is_active = False
        db.commit()
        send_rejection_email(user.email, user.name)
        reply = f"❌ *{user.name}* (`{user.email}`) отклонён — письмо отправлено"
    else:
        return {"ok": True}

    # Редактируем исходное сообщение — убираем кнопки, показываем результат
    if msg_id and TG_ADMIN_CHAT:
        _tg_call("editMessageText", {
            "chat_id": TG_ADMIN_CHAT,
            "message_id": msg_id,
            "text": reply,
            "parse_mode": "Markdown",
        })
    return {"ok": True}

@app.post("/api/admin/register-webhook")
def admin_register_webhook(admin: User = Depends(get_admin_user)):
    """Попытка зарегистрировать Telegram webhook (может не работать из-за DNS)."""
    if not TG_TOKEN:
        return {"ok": False, "error": "TG_TOKEN не задан"}
    try:
        webhook_url = f"{APP_URL}/api/telegram/webhook"
        payload = {"url": webhook_url, "allowed_updates": ["callback_query", "message"]}
        if TELEGRAM_WEBHOOK_SECRET:
            payload["secret_token"] = TELEGRAM_WEBHOOK_SECRET
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TG_TOKEN}/setWebhook",
            data=data, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read())
        return {"ok": True, "tg_response": result}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/api/admin/register-join-mbs-webhook")
def admin_register_join_mbs_webhook(admin: User = Depends(get_admin_user)):
    """Регистрирует webhook для @Join_MBS_bot."""
    if not JOIN_MBS_BOT_TOKEN:
        return {"ok": False, "error": "JOIN_MBS_BOT_TOKEN не задан"}
    try:
        webhook_url = f"{APP_URL}/api/telegram/join-mbs/webhook"
        payload = {"url": webhook_url, "allowed_updates": ["message", "callback_query"]}
        if JOIN_MBS_WEBHOOK_SECRET:
            payload["secret_token"] = JOIN_MBS_WEBHOOK_SECRET
        data = json.dumps(payload).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{JOIN_MBS_BOT_TOKEN}/setWebhook",
            data=data,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read())
        return {"ok": True, "tg_response": result, "bot_username": JOIN_MBS_BOT_USERNAME}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/admin/telegram/setup")
def tg_setup(admin: User = Depends(get_admin_user)):
    """Admin-only endpoint для разовой проверки chat_id старого Telegram-бота."""
    if not TG_TOKEN:
        return {"error": "TELEGRAM_BOT_TOKEN не задан"}
    result = _tg_call("getUpdates", {"limit": 5, "allowed_updates": ["message"]})
    chats = []
    for upd in result.get("result", []):
        msg = upd.get("message", {})
        if msg:
            chats.append({
                "chat_id": msg["chat"]["id"],
                "username": msg["chat"].get("username"),
                "text": msg.get("text"),
            })
    return {"updates": chats}

# ── DRINK OVERRIDES ────────────────────────────────────────────────────

@app.get("/api/drinks/overrides")
def get_drink_overrides():
    """Публичный: список переопределений напитков."""
    import sqlite3
    db_path = DATABASE_URL.replace('sqlite:///', '')
    try:
        con = sqlite3.connect(db_path)
        rows = con.execute("SELECT drink_id, name, price, is_hidden, image_url FROM drink_overrides").fetchall()
        con.close()
        return [{"drink_id": r[0], "name": r[1], "price": r[2], "is_hidden": bool(r[3]), "image_url": r[4]} for r in rows]
    except Exception as e:
        return []

class DrinkOverrideIn(BaseModel):
    drink_id: int
    name: str | None = None
    price: float | None = None
    is_hidden: bool = False
    image_url: str | None = None

@app.post("/api/admin/drinks/override")
def save_drink_override(body: DrinkOverrideIn, admin: User = Depends(get_admin_user)):
    """Admin: сохранить переопределение напитка."""
    import sqlite3
    db_path = DATABASE_URL.replace('sqlite:///', '')
    try:
        con = sqlite3.connect(db_path)
        con.execute("""
            INSERT INTO drink_overrides (drink_id, name, price, is_hidden, image_url, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(drink_id) DO UPDATE SET
                name=excluded.name,
                price=excluded.price,
                is_hidden=excluded.is_hidden,
                image_url=excluded.image_url,
                updated_at=excluded.updated_at
        """, (body.drink_id, body.name, body.price, int(body.is_hidden), body.image_url, datetime.utcnow().isoformat()))
        con.commit()
        con.close()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/drinks/override/{drink_id}")
def delete_drink_override(drink_id: int, admin: User = Depends(get_admin_user)):
    """Admin: сбросить переопределение напитка к дефолту."""
    import sqlite3
    db_path = DATABASE_URL.replace('sqlite:///', '')
    try:
        con = sqlite3.connect(db_path)
        con.execute("DELETE FROM drink_overrides WHERE drink_id=?", (drink_id,))
        con.commit()
        con.close()
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
