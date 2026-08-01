"""
Django settings for codesprint project.
"""

from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MONGO_URI = os.getenv("MONGO_URI", "")

# Gmail OAuth credentials (set in .env)
GMAIL_CLIENT_ID = os.getenv("GMAIL_CLIENT_ID", "")
GMAIL_CLIENT_SECRET = os.getenv("GMAIL_CLIENT_SECRET", "")
GMAIL_REDIRECT_URI = os.getenv("GMAIL_REDIRECT_URI", "http://127.0.0.1:8000/api/gmail/callback/")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# SECURITY
SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-lvs^jbt@7ni7x+23lev#3-dlsx5q&(1)-k_*tpr_es+*2j6amf",
)

DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

# Vercel serverless detection
IS_VERCEL = os.getenv("VERCEL") == "1"

if DEBUG:
    ALLOWED_HOSTS = ["*"]  # Accept all hosts in dev/production
else:
    ALLOWED_HOSTS = ["*"]  # Accept all hosts — tighten for production if needed

# CORS
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL", "True").lower() in ("true", "1")
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "https://career-pilot-rose-nine.vercel.app,http://localhost:5173,http://localhost:5174").split(",")
    if o.strip()
]

from mongoengine import connect

connect(
    host=MONGO_URI
)

# Application definition
INSTALLED_APPS = [
    "corsheaders",
    "django.contrib.auth",       # kept for password hashers only
    "django.contrib.contenttypes", # kept for Django internals
    "django.contrib.staticfiles",
    "rest_framework",
    "users",
    "assistant",
    "cv",
    "tracker",
    "gmail",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "codesprint.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
            ],
        },
    },
]

WSGI_APPLICATION = "codesprint.wsgi.application"

# Database — SQLite kept minimal (ephemeral on Vercel) for Django internals only.
# ALL user data, auth, tokens, CV records, and tracker data are in MongoDB.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": "/tmp/db.sqlite3" if IS_VERCEL else BASE_DIR / "db.sqlite3",
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Internationalization
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = "static/"
STATIC_ROOT = os.path.join("/tmp", "staticfiles") if IS_VERCEL else BASE_DIR / "staticfiles"

if IS_VERCEL:
    # Vercel: use simple storage (no manifest needed)
    STORAGES = {
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }
else:
    STORAGES = {
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
        },
    }

# ChromaDB path — /tmp on Vercel, local folder otherwise
CHROMA_DB_PATH = "/tmp/chroma_db" if IS_VERCEL else str(BASE_DIR / "chroma_db")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# DRF — MongoDB-backed token authentication
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "users.mongo_auth.MongoTokenAuthentication",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
}
