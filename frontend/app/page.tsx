import { PuzzleVisualizer } from "@/components/puzzle-visualizer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Puzzle Lineal BFS
          </h1>
          <p className="mt-3 text-lg text-muted-foreground text-balance">
            Visualizador del algoritmo de Búsqueda en Amplitud para resolver el puzzle lineal
          </p>

        </header>

        <PuzzleVisualizer />

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Algoritmo BFS (Breadth-First Search) para resolución de puzzles</p>
        </footer>
      </div>
    </main>
  )
}
