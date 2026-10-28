# Core layer

Cross-cutting responsibilities are intentionally implemented in the dedicated shared modules under `js/core/`, `py/`, `db/` and `css/core/`. Feature-specific behaviour belongs in `js/components/` or `js/pages/`; reusable markup belongs in `component/`; page composition belongs in `template/`. This folder is reserved for future cross-layer core feature specifications and should not duplicate the executable module sources.
