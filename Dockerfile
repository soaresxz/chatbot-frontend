FROM python:3.12-slim

WORKDIR /app

# Instala dependências do sistema (necessário para algumas libs)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instala as dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código
COPY . .

# Comando para iniciar o FastAPI
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}