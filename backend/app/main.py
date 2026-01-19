from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes_jobs import router as jobs_router

app = FastAPI(title="TraceOps API", version="0.1.0")

# CORS (allow frontend dev server)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs_router)

@app.get("/health")
def health():
    return {"status": "ok"}
