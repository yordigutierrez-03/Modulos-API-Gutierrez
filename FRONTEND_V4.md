# Frontend v4 — Sistema Académico

Esta versión reorganiza la interfaz para que los módulos del UML tengan una vista propia y acciones conectadas a la API.

## Módulos

- Carreras
- Estudiantes + EstadoEstudiante
- Docentes + EstadoDocente
- Asignaturas
- Periodos
- Aulas
- Secciones + EstadoSección
- Matrículas + EstadoMatrícula
- Calificaciones
- Usuario + Rol

## Acciones principales

Los módulos CRUD tienen Nuevo, Guardar, Editar, Eliminar y Actualizar cuando la API dispone de la operación correspondiente.

Matrículas permite registrar, cancelar y eliminar.

Calificaciones permite guardar, editar y eliminar. La nota final y el resultado se calculan en el backend.

Los reportes de historial de estudiante, carga docente y lista de sección se abren en una ventana modal.

## Ejecutar

Desde la carpeta que contiene `main.py`:

```powershell
python -m uvicorn main:app --reload
```

Abrir:

`http://127.0.0.1:8000`

Documentación de la API:

`http://127.0.0.1:8000/docs`

## Tema

El botón de tema cambia entre modo claro y oscuro y guarda la preferencia en el navegador.
