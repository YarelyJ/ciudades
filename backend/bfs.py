from arbol import Nodo


def buscar_solucion_BFS(estado_inicial: list, solucion: list) -> dict:
    """
    Busca la solución usando BFS (Breadth-First Search).
    Retorna un diccionario con los pasos, nodos visitados y estadísticas.
    """
    solucionado = False 
    nodos_visitados = []
    nodos_frontera = []
    pasos_detallados = []
    
    nodo_inicial = Nodo(estado_inicial)
    nodos_frontera.append(nodo_inicial)
    
    iteracion = 0
    
    while (not solucionado) and len(nodos_frontera) != 0:
        iteracion += 1
        nodo = nodos_frontera.pop(0)
        nodos_visitados.append(nodo)
        
        # Registrar paso actual
        paso_actual = {
            "iteracion": iteracion,
            "nodo_actual": nodo.get_datos(),
            "nodos_visitados": len(nodos_visitados),
            "nodos_frontera": len(nodos_frontera),
            "es_solucion": nodo.get_datos() == solucion
        }
        pasos_detallados.append(paso_actual)
        
        if nodo.get_datos() == solucion:
            # Solución encontrada
            resultado = []
            nodo_actual = nodo
            while nodo_actual.get_padre() is not None:
                resultado.append(nodo_actual.get_datos())
                nodo_actual = nodo_actual.get_padre()
            resultado.append(estado_inicial)
            resultado.reverse()
            
            return {
                "exito": True,
                "solucion": resultado,
                "total_pasos": len(resultado),
                "nodos_visitados_total": len(nodos_visitados),
                "iteraciones": iteracion,
                "pasos_detallados": pasos_detallados
            }
        else:
            # Expandir nodos hijos
            dato_nodo = nodo.get_datos()
            hijos = []

            # Operador izquierdo (intercambiar posición 0 y 1)
            hijo = [dato_nodo[1], dato_nodo[0], dato_nodo[2], dato_nodo[3]]
            hijo_izquierdo = Nodo(hijo) 
            if not hijo_izquierdo.en_lista(nodos_visitados) and not hijo_izquierdo.en_lista(nodos_frontera):
                nodos_frontera.append(hijo_izquierdo)
                hijos.append(hijo_izquierdo)

            # Operador central (intercambiar posición 1 y 2)
            hijo = [dato_nodo[0], dato_nodo[2], dato_nodo[1], dato_nodo[3]]
            hijo_central = Nodo(hijo) 
            if not hijo_central.en_lista(nodos_visitados) and not hijo_central.en_lista(nodos_frontera):
                nodos_frontera.append(hijo_central)
                hijos.append(hijo_central)

            # Operador derecho (intercambiar posición 2 y 3)
            hijo = [dato_nodo[0], dato_nodo[1], dato_nodo[3], dato_nodo[2]]
            hijo_derecho = Nodo(hijo) 
            if not hijo_derecho.en_lista(nodos_visitados) and not hijo_derecho.en_lista(nodos_frontera):
                nodos_frontera.append(hijo_derecho)
                hijos.append(hijo_derecho)
            
            nodo.set_hijos(hijos if hijos else None)
    
    return {
        "exito": False,
        "mensaje": "No se encontró solución",
        "nodos_visitados_total": len(nodos_visitados),
        "iteraciones": iteracion,
        "pasos_detallados": pasos_detallados
    }
