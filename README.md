# ⚖️ Lex Laboral - Inteligencia Jurídica Laboral

Lex Laboral es una plataforma avanzada impulsada por inteligencia artificial (Gemini) diseñada para asistir a profesionales del derecho y trabajadores en la gestión de asuntos laborales en México. Ofrece herramientas de análisis, cálculo y redacción automatizada para optimizar procesos legales complejos con parámetros vigentes a **Marzo de 2026**.

**🌐 Accede a la aplicación:** [https://lexlaboral.com.mx](https://lexlaboral.com.mx)

## 🚀 Funcionalidades Principales

*   **💬 Consulta y Análisis Jurídico:** Interfaz conversacional especializada en derecho laboral para resolver dudas y obtener orientación legal inmediata.
*   **📄 Analizador de Documentos:** Herramienta de carga y procesamiento de archivos (PDF/Docs) para extraer cláusulas clave, detectar irregularidades y resumir contratos.
*   **🖋️ Redactor Legal Automatizado (Drafter):** Generación de borradores de demandas, contratos, cartas de despido y otros documentos legales con estructura profesional.
*   **🧮 Calculadora Laboral 2026:** Motor de cálculo actualizado (SMG $312.41) para finiquitos, indemnizaciones por despido, horas extra y salarios.
*   **🏥 Calculadora de Seguridad Social:** Estimación precisa de cuotas IMSS e INFONAVIT con tablas de **Cesantía y Vejez progresivas vigentes a 2026 (UMA $119.35)**.
*   **🔔 Centro de Notificaciones:** Sistema integrado para el seguimiento de cambios legislativos o alertas relevantes.

## 🛠️ Tecnologías

*   **Frontend:** React con TypeScript y Vite.
*   **Backend:** API en **Hono** (Node.js) desplegada en PaaS (Render/Railway), dentro de `backend/`.
*   **Base de conocimiento RAG:** **Supabase** (PostgreSQL + embeddings).
*   **IA:** Google Gemini API para el procesamiento de lenguaje natural.
*   **App móvil:** Capacitor (Android nativo), 100% gratuita y anónima.

## 🚀 Desarrollo

*   **Backend:** `npm run dev --workspace backend` (puerto 3000). Ver `backend/README.md`.
*   **Frontend:** `npm run dev` — el proxy de Vite reenvía `/api` al backend local.
*   **Build Android:** `npm run build && npx cap sync android`.

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---
*Lex Laboral: La tecnología al servicio de la justicia laboral.*
