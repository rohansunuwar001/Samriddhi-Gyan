import uvicorn
from hybrid_recommendation_server.core.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "hybrid_recommendation_server.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
