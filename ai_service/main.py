from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="HealthBuddy AI Microservice", version="2.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "HealthBuddy AI Microservice v2.0 is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}

# Import and include routers
from routes import triage, nlp
app.include_router(triage.router, prefix="/api/triage", tags=["AI Triage"])
app.include_router(nlp.router, prefix="/api/nlp", tags=["NLP & Translation"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
