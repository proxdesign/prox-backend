"""Minimal FastAPI app for Railway deployment test."""
from fastapi import FastAPI
from datetime import datetime

app = FastAPI(title="Prox Test API", version="1.0.0")

@app.get("/")
async def root():
    return {"message": "Prox Test API", "timestamp": datetime.now()}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)