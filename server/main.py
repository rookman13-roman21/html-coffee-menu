from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt as _bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os, json, urllib.request, urllib.parse
import threading, time

import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# ── Конфигурация ──────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET", "change-me-in-production-secret-key-32chars")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@barista-school.online")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")
TG_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TG_ADMIN_CHAT = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "")
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
        con.commit()
        con.close()
    except Exception as e:
        print(f"[migration] warning: {e}")

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

def send_temp_password_email(to_email: str, temp_pass: str, name: str, login_url: str = "") -> bool:
    """Отправить временный пароль на почту."""
    display_name = name if name and name.strip() and name.strip().lower() != to_email.lower() else to_email
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:0;background:#f4f4f4">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;margin:24px auto;max-width:480px">
        <div style="background:#417033;padding:28px 32px 24px">
          <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-.01em">☕ Moscow Barista School</div>
          <div style="font-size:13px;color:#c8e6c0;margin-top:4px">barista-school.online</div>
        </div>
        <div style="padding:32px 32px 24px">
          <p style="color:#1a1a1a;font-size:16px;font-weight:700;margin:0 0 8px">Привет, {display_name}!</p>
          <p style="color:#555;font-size:14px;margin:0 0 24px;line-height:1.6">Мы получили запрос на сброс пароля для вашего аккаунта. Вот ваш временный пароль:</p>
          <div style="background:#f6faf4;border:2px solid #cde3c5;border-radius:12px;padding:20px 24px;margin:0 0 24px">
            <div style="font-size:26px;font-weight:800;letter-spacing:.1em;color:#2d5a20;text-align:center;font-family:monospace">{temp_pass}</div>
          </div>
          <p style="color:#555;font-size:14px;margin:0 0 8px;line-height:1.6">Войдите с этим паролем — его можно будет сменить после входа.</p>
          <p style="color:#999;font-size:13px;margin:0;line-height:1.6">Если вы не запрашивали сброс пароля — просто проигнорируйте это письмо.</p>
        </div>
        <div style="border-top:1px solid #f0f0f0;padding:20px 32px;background:#fafafa">
          <p style="color:#999;font-size:12px;margin:0 0 14px">Это письмо сформировано автоматически — отвечать на него не нужно.</p>
          <a href="https://t.me/Moscow_barista_school" style="display:inline-block;background:#417033;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:10px;font-family:Arial,sans-serif">✈️ Написать в Telegram</a>
        </div>
      </div>
    </div>
    """
    return _send_email(to_email, "Временный пароль — Moscow Barista School", html)

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

class LoginRequest(BaseModel):
    email: str
    password: str

class StatePayload(BaseModel):
    state: dict

class ForgotPasswordRequest(BaseModel):
    email: str
    source: str = "user"  # 'user' или 'admin'

class ResetPasswordRequest(BaseModel):
    token: str
    password: str

# ── FastAPI ───────────────────────────────────────────────────
app = FastAPI(title="Coffee Menu API")

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
        "http://localhost:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── AUTH ──────────────────────────────────────────────────────
@app.post("/api/auth/register")
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email уже зарегистрирован")
    user = User(
        email=body.email.lower(),
        name=body.name or body.email.split("@")[0],
        password_hash=hash_password(body.password),
        is_active=False,
        is_admin=(body.email.lower() == ADMIN_EMAIL.lower()),
        consent=body.consent,
        consent_at=datetime.utcnow() if body.consent else None,
        phone=body.phone.strip() if body.phone else None,
        reg_source="email",
    )
    # Первый зарегистрированный admin — активен сразу
    if user.is_admin:
        user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)
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
    return {"ok": True, "token": token, "user": {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}}

@app.get("/api/auth/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}

# ── STATE ─────────────────────────────────────────────────────
@app.get("/api/state")
def get_state(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(UserState).filter(UserState.user_id == user.id).first()
    if not row:
        return {"state": {}}
    return {"state": json.loads(row.state_json)}

@app.put("/api/state")
def save_state(body: StatePayload, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(UserState).filter(UserState.user_id == user.id).first()
    state_str = json.dumps(body.state, ensure_ascii=False)
    if row:
        row.state_json = state_str
        row.updated_at = datetime.utcnow()
    else:
        row = UserState(user_id=user.id, state_json=state_str)
        db.add(row)
    db.commit()
    return {"ok": True}

# ── ADMIN ─────────────────────────────────────────────────────
@app.get("/api/admin/users")
def admin_list_users(admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [{"id": u.id, "email": u.email, "name": u.name, "phone": u.phone or "", "reg_source": u.reg_source or "email", "is_active": u.is_active, "is_admin": u.is_admin, "consent": bool(u.consent), "consent_at": u.consent_at.isoformat() if u.consent_at else None, "created_at": u.created_at.isoformat() if u.created_at else None, "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None} for u in users]

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
def admin_update_user(user_id: int, body: dict, admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    from pydantic import BaseModel as _BM
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if "is_active" in body:
        if not body["is_active"] and user.is_admin:
            raise HTTPException(status_code=400, detail="Нельзя деактивировать admin")
        user.is_active = bool(body["is_active"])
    if "is_admin" in body and not body["is_admin"] and user.email == ADMIN_EMAIL.lower():
        raise HTTPException(status_code=400, detail="Нельзя снять флаг admin у главного администратора")
    if "is_admin" in body:
        user.is_admin = bool(body["is_admin"])
    db.commit()
    return {"ok": True, "id": user.id, "is_active": user.is_active, "is_admin": user.is_admin}

# ── PASSWORD RESET ───────────────────────────────────────────
@app.post("/api/auth/forgot-password")
def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if user and user.is_active:
        # Генерируем временный пароль (8 символов)
        temp_pass = secrets.token_urlsafe(6)  # ~8 URL-safe символов
        user.password_hash = hash_password(temp_pass)
        # Сбрасываем reset-токены если были
        user.reset_token = None
        user.reset_token_expires = None
        db.commit()
        if body.source == "admin":
            login_url = "https://baristaschool.online/#adm"
        else:
            login_url = "https://barista-school.online"
        email_sent = send_temp_password_email(user.email, temp_pass, user.name, login_url)
        if not email_sent:
            # SMTP не настроен — логируем, но пароль НЕ возвращаем в ответе (безопасность)
            print(f"[security] SMTP failed for {user.email} — temp password NOT returned in response")
            return {"ok": True, "email_sent": False}
    # Всегда отвечаем одинаково (защита от перебора email)
    return {"ok": True, "email_sent": True}

@app.post("/api/auth/reset-password")
def reset_password(body: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not body.token or len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Пароль должен быть минимум 6 символов")
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
        # 4. Генерируем JWT и редиректим в приложение
        jwt_token = create_access_token({"sub": str(user.id)})
        user_json = urllib.parse.quote(_json.dumps({"id": user.id, "email": user.email, "name": user.name, "is_admin": user.is_admin}, ensure_ascii=False))
        return RedirectResponse(f"{APP_URL}/?oauth_token={jwt_token}&oauth_user={user_json}")
    except Exception as e:
        print(f"[yandex oauth] error: {e}")
        return RedirectResponse(f"{APP_URL}/?auth_error=yandex_failed")

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

# ── URL Proxy — для AI-заполнения карточки (извлечение og:image, цены) ──
@app.get("/api/proxy-meta")
def proxy_meta(url: str):
    """Загружает страницу и возвращает og:image, og:title, prices — без CORS-проблем."""
    import urllib.request as ur
    import urllib.parse as _up
    import http.cookiejar as _cj
    import re as _re
    try:
        _UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124'
        jar = _cj.CookieJar()
        opener = ur.build_opener(ur.HTTPCookieProcessor(jar))

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
@app.post("/api/telegram/webhook")
async def tg_webhook(request: Request, db: Session = Depends(get_db)):
    """Получает callback от Telegram при нажатии кнопок."""
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
        data = json.dumps({"url": webhook_url, "allowed_updates": ["callback_query", "message"]}).encode()
        req = urllib.request.Request(
            f"https://api.telegram.org/bot{TG_TOKEN}/setWebhook",
            data=data, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            result = json.loads(r.read())
        return {"ok": True, "tg_response": result}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.get("/api/telegram/setup")
def tg_setup():
    """Вспомогательный endpoint: возвращает chat_id последних входящих сообщений бота.
    Используй один раз, чтобы узнать свой TELEGRAM_ADMIN_CHAT_ID: отправь /start боту и вызови этот URL."""
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
