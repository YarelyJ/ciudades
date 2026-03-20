from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing import List
from bfs import buscar_solucion_BFS

app = FastAPI(
    title="Puzzle Lineal BFS API",
    description="API para resolver el puzzle lineal usando búsqueda en amplitud (BFS)",
    version="1.0.0"
)

# Configurar CORS para permitir conexiones desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PuzzleRequest(BaseModel):
    estado_inicial: List[int]
    solucion: List[int]
    
    @field_validator('estado_inicial', 'solucion')
    @classmethod
    def validate_list_length(cls, v):
        if len(v) != 4:
            raise ValueError('La lista debe tener exactamente 4 elementos')
        if sorted(v) != [1, 2, 3, 4]:
            raise ValueError('La lista debe contener los números 1, 2, 3 y 4')
        return v


class PuzzleResponse(BaseModel):
    exito: bool
    solucion: List[List[int]] | None = None
    total_pasos: int | None = None
    nodos_visitados_total: int
    iteraciones: int
    pasos_detallados: List[dict]
    mensaje: str | None = None


@app.get("/")
def read_root():
    return {
        "mensaje": "Bienvenido a la API del Puzzle Lineal BFS",
        "endpoints": {
            "/resolver": "POST - Resolver el puzzle con estado inicial y solución personalizada",
            "/resolver/default": "GET - Resolver el puzzle con valores por defecto [4,2,3,1] -> [1,2,3,4]",
            "/health": "GET - Verificar estado del servidor"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "servicio": "Puzzle Lineal BFS API"}


@app.get("/resolver/default")
def resolver_default():
    """Resuelve el puzzle con los valores por defecto."""
    estado_inicial = [4, 2, 3, 1]
    solucion = [1, 2, 3, 4]
    
    resultado = buscar_solucion_BFS(estado_inicial, solucion)
    return resultado


@app.post("/resolver", response_model=PuzzleResponse)
def resolver_puzzle(request: PuzzleRequest):
    """Resuelve el puzzle con estado inicial y solución personalizada."""
    try:
        resultado = buscar_solucion_BFS(request.estado_inicial, request.solucion)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
