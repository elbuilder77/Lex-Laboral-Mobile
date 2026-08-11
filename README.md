# ⚖️ Lex Laboral — Calculadoras laborales

Lex Laboral es una aplicación gratuita y sin cuenta para realizar estimaciones laborales en México. Los cálculos se guardan únicamente en el dispositivo y pueden exportarse como PDF.

**🌐 Accede a la aplicación:** [https://lexlaboral.com.mx](https://lexlaboral.com.mx)

## 🚀 Funcionalidades Principales

* **🧮 Liquidación y finiquito:** estima prestaciones e indemnizaciones y muestra su desglose.
* **🏥 Cuotas IMSS e INFONAVIT:** estima cuotas obrero-patronales a partir del salario o del SBC.
* **🏛️ Pensión IMSS:** proyecta una pensión informativa bajo Ley 73 o Ley 97.
* **📄 Exportación PDF:** genera un reporte que se puede guardar o compartir desde Android.

## 🛠️ Tecnologías

*   **Frontend:** React con TypeScript y Vite.
*   **App móvil:** Capacitor (Android nativo), 100% gratuita y anónima.

## 🚀 Desarrollo

*   **Backend:** `npm run dev --workspace backend` (puerto 3000). Ver `backend/README.md`.
*   **Frontend:** `npm run dev` — el proxy de Vite reenvía `/api` al backend local.
*   **Build Android:** `npm run build && npx cap sync android`.

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---
*Lex Laboral: La tecnología al servicio de la justicia laboral.*
