import os
import sys

# Add the server root to Python path so Django can find all apps
server_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if server_root not in sys.path:
    sys.path.insert(0, server_root)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "codesprint.settings")
os.environ["VERCEL"] = "1"

import django
django.setup()

# Run migrations on cold start (SQLite is in /tmp, fresh on each deploy)
try:
    from django.core.management import call_command
    call_command("migrate", "--run-syncdb", verbosity=0)
except Exception as e:
    print(f"Migration warning: {e}")

from django.core.wsgi import get_wsgi_application

app = get_wsgi_application()
