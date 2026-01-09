# Start with Python base image
FROM python:3.11-slim

# Install LibreOffice (only the Writer component to keep it smaller)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libmagic1 \
    libreoffice-writer \
    libreoffice-core \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy your application code
COPY . .

# Expose the port FastAPI will run on
EXPOSE 8000

# Run your FastAPI app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
