from fastapi import FastAPI

app = FastAPI()

@app.get("/predictions/{match_id}")
def by_id(match_id: int):
    return {"id": match_id}

@app.get("/predictions/latest")
def latest():
    return {"latest": True}