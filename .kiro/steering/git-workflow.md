# Reglas de Git Workflow

- **NUNCA** hacer commits ni push directamente a `main`. Siempre trabajar en una rama feature.
- Si ya existe una rama activa (como `feature/multi-instrument-vision`), usar esa rama para los cambios.
- Si no hay rama activa, crear una nueva rama descriptiva antes de commitear (ej: `feature/nombre-del-cambio`).
- Los cambios llegan a `main` exclusivamente vía Pull Request.
- Al hacer push de una rama nueva, usar `git push -u origin <nombre-rama>`.
