FROM python:3.12-slim

WORKDIR /app

# System deps for scientific python wheels (numpy/scikit-learn) and healthcheck curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Data directory for the SQLite database, mounted as a volume in compose
RUN mkdir -p /app/data

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
    CMD curl -f http://localhost:${PORT:-8000}/health || exit 1

CMD uvicorn backend.api.app:api_app --host 0.0.0.0 --port ${PORT:-8000}
