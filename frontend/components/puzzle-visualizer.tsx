"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, ChevronLeft, ChevronRight, Zap, RefreshCw } from "lucide-react"

interface PuzzleStep {
  iteracion: number
  nodo_actual: number[]
  nodos_visitados: number
  nodos_frontera: number
  es_solucion: boolean
}

interface PuzzleResult {
  exito: boolean
  solucion: number[][]
  total_pasos: number
  nodos_visitados_total: number
  iteraciones: number
  pasos_detallados: PuzzleStep[]
}

function buildDemoData(initial: number[], target: number[]): PuzzleResult {
  // Simple BFS simulation for demo mode
  const steps: number[][] = [initial]
  const visited = new Set<string>()
  const queue: number[][] = [initial]
  visited.add(JSON.stringify(initial))
  const parent: Map<string, number[]> = new Map()

  const ops = [
    (s: number[]) => { const n = [...s]; [n[0], n[1]] = [n[1], n[0]]; return n },
    (s: number[]) => { const n = [...s]; [n[1], n[2]] = [n[2], n[1]]; return n },
    (s: number[]) => { const n = [...s]; [n[2], n[3]] = [n[3], n[2]]; return n },
  ]

  let found = false
  let totalVisited = 1

  while (queue.length > 0 && !found) {
    const cur = queue.shift()!
    for (const op of ops) {
      const next = op(cur)
      const key = JSON.stringify(next)
      if (!visited.has(key)) {
        visited.add(key)
        parent.set(key, cur)
        totalVisited++
        queue.push(next)
        if (JSON.stringify(next) === JSON.stringify(target)) {
          found = true
          break
        }
      }
    }
  }

  // Reconstruct path
  const path: number[][] = []
  let cur: number[] | undefined = target
  while (cur) {
    path.unshift(cur)
    cur = parent.get(JSON.stringify(cur))
  }
  if (path.length === 0 || JSON.stringify(path[0]) !== JSON.stringify(initial)) {
    path.unshift(initial)
  }

  return {
    exito: found,
    solucion: path,
    total_pasos: path.length,
    nodos_visitados_total: totalVisited,
    iteraciones: totalVisited,
    pasos_detallados: [],
  }
}

function parseInput(value: string): number[] | null {
  const parts = value
    .replace(/[\[\]\s]/g, "")
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
  if (parts.length !== 4) return null
  if (parts.some(isNaN)) return null
  if (new Set(parts).size !== 4) return null
  if (parts.some((n) => n < 1 || n > 4)) return null
  return parts
}

export function PuzzleVisualizer() {
  const [initialInput, setInitialInput] = useState("4, 2, 3, 1")
  const [targetInput, setTargetInput] = useState("1, 2, 3, 4")
  const [inputError, setInputError] = useState<string | null>(null)

  const [data, setData] = useState<PuzzleResult | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [source, setSource] = useState<"api" | "demo">("demo")

  const solve = useCallback(async (initial: number[], target: number[]) => {
    setIsLoading(true)
    setIsPlaying(false)
    setCurrentStep(0)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL

    if (apiUrl) {
      try {
        const res = await fetch(`${apiUrl.replace(/\/$/, "")}/resolver`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estado_inicial: initial, solucion: target }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const result: PuzzleResult = await res.json()
        setData(result)
        setSource("api")
      } catch {
        setData(buildDemoData(initial, target))
        setSource("demo")
      }
    } else {
      setData(buildDemoData(initial, target))
      setSource("demo")
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    solve([4, 2, 3, 1], [1, 2, 3, 4])
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
    const initial = parseInput(initialInput)
    const target = parseInput(targetInput)

    if (!initial) {
      setInputError("Estado inicial inválido. Ingresa 4 números del 1 al 4 sin repetir (ej: 4, 2, 3, 1).")
      return
    }
    if (!target) {
      setInputError("Estado objetivo inválido. Ingresa 4 números del 1 al 4 sin repetir (ej: 1, 2, 3, 4).")
      return
    }
    setInputError(null)
    solve(initial, target)
  }

  const reset = () => {
    setCurrentStep(0)
    setIsPlaying(false)
  }

  const togglePlay = () => {
    if (currentStep >= (data?.solucion.length ?? 0) - 1) setCurrentStep(0)
    setIsPlaying(!isPlaying)
  }

  const targetState = parseInput(targetInput) ?? [1, 2, 3, 4]

  return (
    <div className="space-y-6">

      {/* Editable States */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Configurar Puzzle</CardTitle>
          <CardDescription>
            Ingresa 4 números del 1 al 4 sin repetir, separados por comas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="initial-input" className="text-sm font-medium">
                Estado inicial
              </label>
              <input
                id="initial-input"
                type="text"
                value={initialInput}
                onChange={(e) => setInitialInput(e.target.value)}
                placeholder="ej: 4, 2, 3, 1"
                className="w-full px-3 py-2 text-sm border rounded-md bg-background font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="target-input" className="text-sm font-medium">
                Estado objetivo
              </label>
              <input
                id="target-input"
                type="text"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                placeholder="ej: 1, 2, 3, 4"
                className="w-full px-3 py-2 text-sm border rounded-md bg-background font-mono"
              />
            </div>
          </div>
          {inputError && (
            <p className="text-sm text-destructive">{inputError}</p>
          )}
          <div className="flex items-center justify-between">
            <Button onClick={handleSolve} disabled={isLoading} className="gap-2">
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Resolviendo..." : "Resolver"}
            </Button>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${source === "api" ? "bg-chart-2" : "bg-chart-3"}`}
              />
              <span className="text-xs text-muted-foreground">
                {source === "api" ? "API en vivo" : "Cálculo local"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {!data ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse text-muted-foreground">Calculando...</div>
        </div>
      ) : (
        <>
          {/* Main Visualization */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-5 text-chart-1" />
                  Estado Actual
                </CardTitle>
                <CardDescription>
                  Paso {currentStep + 1} de {data.solucion.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-3">
                  {data.solucion[currentStep].map((num, idx) => {
                    const isInPlace = num === targetState[idx]
                    return (
                      <div
                        key={idx}
                        className={`
                          flex items-center justify-center
                          w-16 h-16 sm:w-20 sm:h-20
                          text-2xl sm:text-3xl font-bold rounded-lg
                          transition-all duration-300
                          ${isInPlace
                            ? "bg-chart-2 text-foreground shadow-lg scale-105"
                            : "bg-muted text-muted-foreground"
                          }
                        `}
                      >
                        {num}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 flex justify-center gap-2">
                  {data.solucion[currentStep].map((_, idx) => (
                    <div key={idx} className="w-16 sm:w-20 text-center text-xs text-muted-foreground">
                      Pos {idx}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Target State */}
            <Card>
              <CardHeader>
                <CardTitle>Estado Objetivo</CardTitle>
                <CardDescription>Configuración que buscamos alcanzar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-3">
                  {targetState.map((num, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 text-2xl sm:text-3xl font-bold rounded-lg bg-chart-2/20 text-foreground border-2 border-chart-2"
                    >
                      {num}
                    </div>
                  ))}
                </div>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  [{targetState.join(", ")}]
                </p>
              </CardContent>
            </Card>
          </div>

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
                  onClick={() => setCurrentStep(Math.min(data.solucion.length - 1, currentStep + 1))}
                  disabled={currentStep === data.solucion.length - 1}
                >
                  <ChevronRight className="size-4" />
                  <span className="sr-only">Paso siguiente</span>
                </Button>
              </div>
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

          {/* Solution Steps */}
          <Card>
            <CardHeader>
              <CardTitle>Secuencia de Solución</CardTitle>
              <CardDescription>Pasos encontrados por el algoritmo BFS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.solucion.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentStep(idx); setIsPlaying(false) }}
                    className={`
                      flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-mono transition-all
                      ${idx === currentStep
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : idx < currentStep
                        ? "bg-muted text-muted-foreground"
                        : "bg-secondary text-secondary-foreground"
                      }
                    `}
                  >
                    <span className="text-xs opacity-60">{idx + 1}.</span>
                    [{step.join(", ")}]
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas del Algoritmo</CardTitle>
              <CardDescription>Métricas de rendimiento de la búsqueda BFS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-3xl font-bold text-chart-1">{data.total_pasos}</div>
                  <div className="text-sm text-muted-foreground">Pasos totales</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-3xl font-bold text-chart-2">{data.nodos_visitados_total}</div>
                  <div className="text-sm text-muted-foreground">Nodos visitados</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-3xl font-bold text-chart-3">{data.iteraciones}</div>
                  <div className="text-sm text-muted-foreground">Iteraciones</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <Badge variant={data.exito ? "default" : "destructive"} className="text-lg px-4 py-1">
                    {data.exito ? "Éxito" : "Fallido"}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Resultado</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Algorithm Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>¿Cómo funciona el algoritmo BFS?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                <strong className="text-foreground">Búsqueda en Amplitud (BFS)</strong> explora el árbol de estados
                nivel por nivel. Comienza desde el estado inicial y expande todos los nodos vecinos antes de pasar al
                siguiente nivel.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium text-foreground mb-1">Operador Izquierdo</div>
                  <div className="text-sm">Intercambia posiciones 0 y 1</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium text-foreground mb-1">Operador Central</div>
                  <div className="text-sm">Intercambia posiciones 1 y 2</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium text-foreground mb-1">Operador Derecho</div>
                  <div className="text-sm">Intercambia posiciones 2 y 3</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
