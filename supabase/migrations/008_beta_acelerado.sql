-- ============================================================
-- GolStreet — Migración 008: Beta Acelerado
-- Mueve el estado de simulación a una tabla por tenant
-- para que el beta no interfiera con el Mundial real
-- ============================================================

-- ── 1. Columnas de beta en tenants ───────────────────────────
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS modo_acelerado    BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS beta_inicio       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS beta_duracion_dias INT        NOT NULL DEFAULT 7;

COMMENT ON COLUMN public.tenants.modo_acelerado      IS 'Si true, los 72 partidos se comprimen en beta_duracion_dias días desde beta_inicio';
COMMENT ON COLUMN public.tenants.beta_inicio         IS 'Timestamp de inicio de la simulación beta (NULL = no iniciada)';
COMMENT ON COLUMN public.tenants.beta_duracion_dias  IS 'Duración de la simulación beta en días (default 7)';

-- ── 2. Tabla de resultados por tenant ────────────────────────
-- Los resultados simulados son POR TENANT para que:
-- a) Distintos tenants puedan tener betas independientes
-- b) El beta no marque como "jugados" los partidos del Mundial real
CREATE TABLE IF NOT EXISTS public.fixtures_simuladas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fixture_id      UUID        NOT NULL REFERENCES public.fixtures(id) ON DELETE CASCADE,
  simulado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  local_goles     SMALLINT    NOT NULL,
  visitante_goles SMALLINT    NOT NULL,
  UNIQUE (tenant_id, fixture_id)
);

CREATE INDEX IF NOT EXISTS idx_fixtures_sim_tenant
  ON public.fixtures_simuladas (tenant_id);

-- RLS
ALTER TABLE public.fixtures_simuladas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fxsim_select_member"
  ON public.fixtures_simuladas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_members tm
      WHERE tm.tenant_id = fixtures_simuladas.tenant_id
        AND tm.user_id = auth.uid()
        AND tm.activo = true
    )
  );

CREATE POLICY "fxsim_service_all"
  ON public.fixtures_simuladas FOR ALL
  USING (auth.role() = 'service_role');

-- ── 3. Limpiar estado global de fixtures ─────────────────────
-- Los campos simulado/goles en fixtures son ahora responsabilidad
-- de fixtures_simuladas por tenant. Los dejamos en la tabla
-- solo como referencia del resultado "canónico" del Mundial real.
-- (No eliminamos las columnas para no romper queries existentes,
--  pero el simulador ya no las escribe en modo beta)

-- Asegurarnos de que todas las fixtures estén sin simular
-- para que el Motor las procese en el Mundial real
UPDATE public.fixtures SET
  simulado        = false,
  simulado_en     = NULL,
  local_goles     = NULL,
  visitante_goles = NULL
WHERE simulado = true;
