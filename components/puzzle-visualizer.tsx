"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, MapPin, RefreshCw } from "lucide-react"

// ─── Graph definition ────────────────────────────────────────────────────────

export const CITIES = [
  "TAMAULIPAS",
  "CDMX",
  "HIDALGO",
  "MORELOS",
  "MONTERREY",
  "JILOYORK",
  "ORO",
  "SLP",
  "ZACATECAS",
  "GDL",
] as const

export type City = (typeof CITIES)[number]

// Adjacency list: city → [neighbor, distanceKm][]
export const GRAPH: Record<City, [City, number][]> = {
  TAMAULIPAS: [
    ["CDMX", 513],
    ["MONTERREY", 514],
    ["GDL", 125],
  ],
  CDMX: [
    ["TAMAULIPAS", 513],
    ["MORELOS", 203],
    ["JILOYORK", 313],
    ["ORO", 309],
    ["ZACATECAS", 355],
    ["GDL", 603],
  ],
  HIDALGO: [
    ["MORELOS", 390],
    ["JILOYORK", 599],
  ],
  MORELOS: [
    ["CDMX", 203],
    ["HIDALGO", 390],
    ["JILOYORK", 437],
  ],
  MONTERREY: [["TAMAULIPAS", 514]],
  JILOYORK: [
    ["CDMX", 313],
    ["MORELOS", 437],
    ["HIDALGO", 599],
    ["ORO", 394],
  ],
  ORO: [
    ["CDMX", 309],
    ["JILOYORK", 394],
    ["SLP", 296],
  ],
  SLP: [
    ["ORO", 296],
    ["ZACATECAS", 346],
  ],
  ZACATECAS: [
    ["CDMX", 355],
    ["SLP", 346],
    ["GDL", 91],
  ],
  GDL: [
    ["TAMAULIPAS", 125],
    ["CDMX", 603],
    ["ZACATECAS", 91],
  ],
}

// ─── BFS over city graph ──────────────────────────────────────────────────────

interface CityResult {
  exito: boolean
  solucion: City[]
  total_pasos: number
  distancia_total: number
  nodos_visitados_total: number
  iteraciones: number
}

function bfsCities(start: City, goal: City): CityResult {
  if (start === goal) {
    return {
      exito: true,
      solucion: [start],
      total_pasos: 1,
      distancia_total: 0,
      nodos_visitados_total: 1,
      iteraciones: 1,
    }
  }

  const visited = new Set<City>([start])
  const queue: City[][] = [[start]]
  let iterations = 0

  while (queue.length > 0) {
    iterations++
    const path = queue.shift()!
    const current = path[path.length - 1]

    for (const [neighbor] of GRAPH[current]) {
      if (visited.has(neighbor)) continue
      visited.add(neighbor)
      const newPath = [...path, neighbor]

      if (neighbor === goal) {
        // compute total distance
        let dist = 0
        for (let i = 0; i < newPath.length - 1; i++) {
          const from = newPath[i]
          const to = newPath[i + 1]
          const edge = GRAPH[from].find(([c]) => c === to)
          if (edge) dist += edge[1]
        }
        return {
          exito: true,
          solucion: newPath,
          total_pasos: newPath.length,
          distancia_total: dist,
          nodos_visitados_total: visited.size,
          iteraciones: iterations,
        }
      }
      queue.push(newPath)
    }
  }

  return {
    exito: false,
    solucion: [],
    total_pasos: 0,
    distancia_total: 0,
    nodos_visitados_total: visited.size,
    iteraciones: iterations,
  }
}

// ─── Graph SVG visualization ──────────────────────────────────────────────────

// Approximate pixel positions for each city (matching the image layout)
const NODE_POSITIONS: Record<City, { x: number; y: number }> = {
  HIDALGO:    { x: 60,  y: 220 },
  MORELOS:    { x: 185, y: 300 },
  JILOYORK:   { x: 260, y: 100 },
  CDMX:       { x: 320, y: 310 },
  ORO:        { x: 420, y: 185 },
  SLP:        { x: 530, y: 170 },
  ZACATECAS:  { x: 540, y: 270 },
  GDL:        { x: 510, y: 360 },
  TAMAULIPAS: { x: 295, y: 420 },
  MONTERREY:  { x: 130, y: 420 },
}

interface GraphSVGProps {
  path: City[]
  currentStep: number
}

function GraphSVG({ path, currentStep }: GraphSVGProps) {
  const visitedSet = new Set(path.slice(0, currentStep + 1))
  const activeEdges = new Set<string>()
  for (let i = 0; i < currentStep; i++) {
    const a = path[i]
    const b = path[i + 1]
    activeEdges.add(`${a}|${b}`)
    activeEdges.add(`${b}|${a}`)
  }

  // Collect unique edges
  const edges: { a: City; b: City; dist: number }[] = []
  const seen = new Set<string>()
  for (const city of CITIES) {
    for (const [neighbor, dist] of GRAPH[city]) {
      const key = [city, neighbor].sort().join("|")
      if (!seen.has(key)) {
        seen.add(key)
        edges.push({ a: city, b: neighbor, dist })
      }
    }
  }

  return (
    <svg
      viewBox="0 0 620 500"
      className="w-full max-w-2xl mx-auto"
      aria-label="Mapa del grafo de ciudades"
    >
      {/* Edges */}
      {edges.map(({ a, b, dist }) => {
        const pa = NODE_POSITIONS[a]
        const pb = NODE_POSITIONS[b]
        const isActive = activeEdges.has(`${a}|${b}`)
        const mx = (pa.x + pb.x) / 2
        const my = (pa.y + pb.y) / 2
        return (
          <g key={`${a}-${b}`}>
            <line
              x1={pa.x} y1={pa.y}
              x2={pb.x} y2={pb.y}
              stroke={isActive ? "hsl(var(--chart-1))" : "hsl(var(--border))"}
              strokeWidth={isActive ? 3 : 1.5}
              strokeDasharray={isActive ? "none" : "none"}
            />
            <text
              x={mx}
              y={my - 5}
              textAnchor="middle"
              fontSize={10}
              fill={isActive ? "hsl(var(--chart-1))" : "hsl(var(--muted-foreground))"}
              fontWeight={isActive ? "700" : "400"}
            >
              {dist} km
            </text>
          </g>
        )
      })}

      {/* Nodes */}
      {CITIES.map((city) => {
        const pos = NODE_POSITIONS[city]
        const isVisited = visitedSet.has(city)
        const isCurrent = path[currentStep] === city
        const isStart = path[0] === city
        const isGoal = path[path.length - 1] === city

        let fill = "hsl(var(--muted))"
        let stroke = "hsl(var(--border))"
        let textFill = "hsl(var(--muted-foreground))"

        if (isVisited) {
          fill = "hsl(var(--chart-2))"
          stroke = "hsl(var(--chart-2))"
          textFill = "hsl(var(--foreground))"
        }
        if (isCurrent) {
          fill = "hsl(var(--chart-1))"
          stroke = "hsl(var(--chart-1))"
          textFill = "hsl(var(--foreground))"
        }
        if (isStart || isGoal) {
          stroke = "hsl(var(--primary))"
        }

        return (
          <g key={city}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={22}
              fill={fill}
              stroke={stroke}
              strokeWidth={isCurrent ? 3 : 2}
            />
            <text
              x={pos.x}
              y={pos.y + 4}
              textAnchor="middle"
              fontSize={city.length > 7 ? 7 : 8}
              fontWeight="600"
              fill={textFill}
            >
              {city}
            </text>
            {isStart && (
              <text x={pos.x} y={pos.y - 28} textAnchor="middle" fontSize={9} fill="hsl(var(--primary))" fontWeight="700">
                INICIO
              </text>
            )}
            {isGoal && path[0] !== path[path.length - 1] && (
              <text x={pos.x} y={pos.y - 28} textAnchor="middle" fontSize={9} fill="hsl(var(--primary))" fontWeight="700">
                META
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PuzzleVisualizer() {
  const [startCity, setStartCity] = useState<City>("TAMAULIPAS")
  const [goalCity, setGoalCity] = useState<City>("HIDALGO")
  const [inputError, setInputError] = useState<string | null>(null)

  const [data, setData] = useState<CityResult | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const solve = useCallback((start: City, goal: City) => {
    setIsLoading(true)
    setIsPlaying(false)
    setCurrentStep(0)
    // Run synchronously (graph is small)
    const result = bfsCities(start, goal)
    setData(result)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    solve("TAMAULIPAS", "HIDALGO")
  }, [solve])

  useEffect(() => {
    if (!isPlaying || !data) return
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= data.solucion.length - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
    }, 900)
    return () => clearInterval(interval)
  }, [isPlaying, data])

  const handleSolve = () => {
    if (startCity === goalCity) {
      setInputError("La ciudad de inicio y destino no pueden ser la misma.")
      return
    }
    setInputError(null)
    solve(startCity, goalCity)
  }

  const reset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (currentStep >= (data?.solucion.length ?? 0) - 1) setCurrentStep(0)
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="space-y-6">

      {/* Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurar Ruta</CardTitle>
          <CardDescription>
            Selecciona la ciudad de origen y destino para buscar la ruta con menor número de transbordos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="start-city" className="text-sm font-medium">
                Ciudad de origen
              </label>
              <select
                id="start-city"
                value={startCity}
                onChange={(e) => setStartCity(e.target.value as City)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="goal-city" className="text-sm font-medium">
                Ciudad destino
              </label>
              <select
                id="goal-city"
                value={goalCity}
                onChange={(e) => setGoalCity(e.target.value as City)}
                className="w-full px-3 py-2 text-sm border rounded-md bg-background"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {inputError && (
            <p className="text-sm text-destructive">{inputError}</p>
          )}
          <Button onClick={handleSolve} disabled={isLoading} className="gap-2">
            <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Buscando..." : "Buscar ruta"}
          </Button>
        </CardContent>
      </Card>

      {!data ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-muted-foreground">Calculando...</div>
        </div>
      ) : (
        <>
          {/* Graph visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-5 text-chart-1" />
                Grafo de Ciudades
              </CardTitle>
              <CardDescription>
                Paso {currentStep + 1} de {data.solucion.length} —{" "}
                Ciudad actual:{" "}
                <strong>{data.solucion[currentStep]}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.exito ? (
                <GraphSVG path={data.solucion} currentStep={currentStep} />
              ) : (
                <div className="flex items-center justify-center min-h-[200px] text-destructive font-medium">
                  No se encontro ruta entre {startCity} y {goalCity}
                </div>
              )}
            </CardContent>
          </Card>

          {data.exito && (
            <>
              {/* Controls */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                      disabled={currentStep === 0}
                    >
                      <ChevronLeft className="size-4" />
                      <span className="sr-only">Paso anterior</span>
                    </Button>
                    <Button variant="outline" size="icon" onClick={reset}>
                      <RotateCcw className="size-4" />
                      <span className="sr-only">Reiniciar</span>
                    </Button>
                    <Button size="lg" onClick={togglePlay} className="px-8">
                      {isPlaying ? (
                        <><Pause className="size-4 mr-2" />Pausar</>
                      ) : (
                        <><Play className="size-4 mr-2" />Reproducir</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setCurrentStep(Math.min(data.solucion.length - 1, currentStep + 1))
                      }
                      disabled={currentStep === data.solucion.length - 1}
                    >
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Paso siguiente</span>
                    </Button>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-6 flex gap-1">
                    {data.solucion.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setCurrentStep(idx); setIsPlaying(false) }}
                        className={`
                          flex-1 h-2 rounded-full transition-colors
                          ${idx <= currentStep ? "bg-primary" : "bg-muted"}
                          ${idx === currentStep ? "ring-2 ring-primary ring-offset-2" : ""}
                        `}
                        aria-label={`Ir al paso ${idx + 1}`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Solution path */}
              <Card>
                <CardHeader>
                  <CardTitle>Ruta Encontrada</CardTitle>
                  <CardDescription>
                    Secuencia de ciudades por BFS (menor numero de transbordos)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    {data.solucion.map((city, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <button
                          onClick={() => { setCurrentStep(idx); setIsPlaying(false) }}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-semibold transition-all
                            ${idx === currentStep
                              ? "bg-primary text-primary-foreground shadow-md scale-105"
                              : idx < currentStep
                              ? "bg-chart-2/30 text-foreground"
                              : "bg-muted text-muted-foreground"
                            }
                          `}
                        >
                          {city}
                        </button>
                        {idx < data.solucion.length - 1 && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {(() => {
                              const edge = GRAPH[city].find(([c]) => c === data.solucion[idx + 1])
                              return edge ? `→ ${edge[1]} km` : "→"
                            })()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Estadisticas del Algoritmo</CardTitle>
                  <CardDescription>Metricas de rendimiento de la busqueda BFS</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-3xl font-bold text-chart-1">{data.total_pasos}</div>
                      <div className="text-sm text-muted-foreground">Ciudades en ruta</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-3xl font-bold text-chart-2">{data.total_pasos - 1}</div>
                      <div className="text-sm text-muted-foreground">Transbordos</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-2xl font-bold text-chart-3">{data.distancia_total.toLocaleString()} km</div>
                      <div className="text-sm text-muted-foreground">Distancia total</div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted">
                      <div className="text-3xl font-bold text-chart-4">{data.nodos_visitados_total}</div>
                      <div className="text-sm text-muted-foreground">Nodos explorados</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Algorithm explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Como funciona BFS en este grafo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Busqueda en Amplitud (BFS)</strong> explora el grafo nivel
                por nivel desde la ciudad origen. Cada nivel representa un transbordo adicional, por lo que
                el primer camino encontrado siempre tiene el{" "}
                <strong className="text-foreground">menor numero de transbordos posible</strong>.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium text-foreground mb-1">Criterio de busqueda</div>
                  <div className="text-sm">Minimo numero de transbordos entre ciudades</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium text-foreground mb-1">Pesos de aristas</div>
                  <div className="text-sm">Distancias en km entre ciudades conectadas por carretera</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium text-foreground mb-1">Completitud</div>
                  <div className="text-sm">BFS garantiza encontrar la ruta optima si existe</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
