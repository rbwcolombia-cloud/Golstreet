-- ============================================================
-- GolStreet — Migración 006: Modo Simulación pre-Mundial
-- Activa partidos amistosos simulados para beta F&F
-- ============================================================

-- Agregar columna modo_simulacion a tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS modo_simulacion BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tenants.modo_simulacion IS
  'Activa partidos amistosos simulados 2x semana para beta pre-Mundial';

-- Índice para filtrar tenants con simulación activa
CREATE INDEX IF NOT EXISTS idx_tenants_modo_simulacion
  ON public.tenants (modo_simulacion)
  WHERE modo_simulacion = true;
