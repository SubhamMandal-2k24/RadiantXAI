# Use a slim Python base image to keep the container small
FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (separate layer, so Docker caches this
# step and doesn't reinstall on every code change -- only reruns if
# requirements.txt itself changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the actual application code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]