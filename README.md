# CPU Lab — simulador de planificación de procesos

Presentación interactiva en español de **FIFO, SJF, SRTF, Round Robin y Prioridades**. HTML, CSS y JavaScript puros. **Sin dependencias**, sin backend y sin paso de compilación.

## Ejecutar localmente

Puedes abrir `index.html` directamente en el navegador. Alternativamente, ejecuta `python3 -m http.server 5173` en esta carpeta y abre `http://localhost:5173`.

## Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel, selecciona **Add New → Project** e importa el repositorio.
3. Si pide un framework, selecciona **Other**. Deja **Build Command** vacío y **Output Directory** sin configurar (raíz del proyecto).
4. Pulsa **Deploy**. No necesitas variables de entorno ni base de datos.

## Controles

- **Espacio**: reproducir / pausar.
- **→ / ←**: avanzar / retroceder una unidad.
- **1–5**: cambiar algoritmo.
- **R**: reiniciar.
- **F**: pantalla completa.
- **Esc**: cerrar ventana emergente.
- **Editar procesos**: cambiar llegada, duración y prioridad (hasta 6 procesos).
- **Escenarios**: ejemplos preconfigurados.
- **Comparar**: resultados finales con las mismas entradas para los cinco algoritmos.

## Modelo de simulación

- CPU de un solo núcleo; ráfagas de CPU enteras en unidades discretas; sin tiempos de bloqueo/entrada-salida.
- FIFO y SJF no apropiativos; SRTF y Round Robin apropiativos; Prioridades seleccionable.
- SJF y SRTF usan duraciones exactas dadas en el ejercicio; en sistemas reales requieren estimación.
- Número de prioridad menor = prioridad mayor.
- Si no hay criterio estrictamente mejor, el proceso que se ejecuta continúa en SRTF/prioridades apropiativas. Otros empates siguen la posición en cola de listos.
- En Round Robin, las nuevas llegadas de un instante entran antes que el proceso cuyo quantum acaba de expirar.
- Se desprecia el tiempo de cambio de contexto, para aislar la política de planificación.
- Espera = finalización − llegada − ráfaga; retorno = finalización − llegada; respuesta = primera ejecución − llegada.

Proyecto educativo; no replica el planificador concreto de Linux o Windows.
# cpu-lab
