import uvicorn
from findash.app import app

if __name__ == "__main__":
    uvicorn.run(
        "findash.app:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )
