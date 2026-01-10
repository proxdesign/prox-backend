"""Minimal FastAPI app for Railway deployment test."""
from fastapi import FastAPI
from datetime import datetime
import os

app = FastAPI(title="Prox Test API", version="1.0.0")

@app.get("/")
async def root():
    return {
        "message": "Prox Test API", 
        "timestamp": datetime.now(),
        "port": os.getenv("PORT", "not-set"),
        "railway_environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "not-set")
    }

@app.get("/health")
async def health():
    return {
        "status": "ok", 
        "timestamp": datetime.now(),
        "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME", "unknown"),
        "service": os.getenv("RAILWAY_SERVICE_NAME", "unknown")
    }

@app.get("/debug")
async def debug():
    return {
        "port": os.getenv("PORT"),
        "railway_vars": {
            "environment": os.getenv("RAILWAY_ENVIRONMENT_NAME"),
            "service": os.getenv("RAILWAY_SERVICE_NAME"),
            "project": os.getenv("RAILWAY_PROJECT_NAME"),
            "public_domain": os.getenv("RAILWAY_PUBLIC_DOMAIN"),
            "private_domain": os.getenv("RAILWAY_PRIVATE_DOMAIN")
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)