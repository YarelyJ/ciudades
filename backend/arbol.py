class Nodo:
    def __init__(self, datos, hijos=None):
        self.datos = datos
        self.hijos = None
        self.padre = None
        self.costo = None
        self.set_hijos(hijos)

    def set_hijos(self, hijos):
        self.hijos = hijos
        if self.hijos is not None:
            for h in self.hijos:
                h.padre = self

    def get_hijos(self):
        return self.hijos
    
    def set_padre(self, padre):
        self.padre = padre
    
    def get_padre(self):
        return self.padre

    def set_datos(self, datos):
        self.datos = datos

    def get_datos(self):
        return self.datos
    
    def set_costo(self, costo):
        self.costo = costo

    def get_costo(self):
        return self.costo
    
    def igual(self, nodo):
        return self.get_datos() == nodo.get_datos()
        
    def en_lista(self, lista_nodos):
        for n in lista_nodos:
            if self.igual(n):
                return True
        return False
    
    def __str__(self):
        return str(self.get_datos())
