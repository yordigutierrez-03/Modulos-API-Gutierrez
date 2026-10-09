# Actualización v6

- Corregido el formulario de edición de estados booleanos (`Activo/Inactivo`), incluyendo períodos.
- Al guardar un registro, la tabla se recarga automáticamente.
- Se invalidan y recargan los catálogos relacionados para que los nuevos registros aparezcan en los select sin usar el botón Actualizar.
- Al eliminar un registro, también se actualiza automáticamente el módulo y el dashboard.
- El botón Guardar muestra "Guardando..." mientras se procesa la operación.

Para ejecutar:

```powershell
python -m uvicorn main:app --reload
```
