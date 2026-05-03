-- ============================================================
-- GolStreet — Migración 007: Fase de Grupos FIFA World Cup 2026
-- 12 grupos × 4 equipos = 48 equipos · 72 partidos
-- Calendario real con sedes y horarios UTC
-- ============================================================

-- ── 1. Columna grupo en teams ────────────────────────────────
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS grupo TEXT;

UPDATE public.teams SET grupo = 'A' WHERE codigo_pais IN ('USA','URU','MAR','HON');
UPDATE public.teams SET grupo = 'B' WHERE codigo_pais IN ('MEX','ARG','SUI','CMR');
UPDATE public.teams SET grupo = 'C' WHERE codigo_pais IN ('CAN','ENG','IRN','GHA');
UPDATE public.teams SET grupo = 'D' WHERE codigo_pais IN ('BRA','CRO','KOR','KSA');
UPDATE public.teams SET grupo = 'E' WHERE codigo_pais IN ('FRA','DEN','SEN','PAR');
UPDATE public.teams SET grupo = 'F' WHERE codigo_pais IN ('ESP','AUS','NGA','PAN');
UPDATE public.teams SET grupo = 'G' WHERE codigo_pais IN ('GER','COL','JPN','TUN');
UPDATE public.teams SET grupo = 'H' WHERE codigo_pais IN ('POR','TUR','ECU','NZL');
UPDATE public.teams SET grupo = 'I' WHERE codigo_pais IN ('NED','ITA','SCO','IRQ');
UPDATE public.teams SET grupo = 'J' WHERE codigo_pais IN ('BEL','AUT','EGY','MLI');
UPDATE public.teams SET grupo = 'K' WHERE codigo_pais IN ('SRB','ALG','CRC','UKR');
UPDATE public.teams SET grupo = 'L' WHERE codigo_pais IN ('CIV','UZB','SVK','RSA');

-- ── 2. Tabla de fixtures ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fixtures (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo           CHAR(1)     NOT NULL,
  jornada         SMALLINT    NOT NULL CHECK (jornada BETWEEN 1 AND 3),
  local_id        UUID        NOT NULL REFERENCES public.teams(id),
  visitante_id    UUID        NOT NULL REFERENCES public.teams(id),
  fecha_hora      TIMESTAMPTZ NOT NULL,
  sede            TEXT,
  ciudad          TEXT,
  simulado        BOOLEAN     NOT NULL DEFAULT false,
  simulado_en     TIMESTAMPTZ,
  local_goles     SMALLINT,
  visitante_goles SMALLINT,
  UNIQUE (local_id, visitante_id)
);

CREATE INDEX IF NOT EXISTS idx_fixtures_pending
  ON public.fixtures (fecha_hora, simulado)
  WHERE simulado = false;

CREATE INDEX IF NOT EXISTS idx_fixtures_grupo
  ON public.fixtures (grupo, jornada);

-- ── 3. Los 72 partidos de la fase de grupos ──────────────────
-- Formato: (grupo, jornada, local_código, visitante_código, fecha_hora_UTC, ciudad)
-- MD1: 11-19 jun  ·  MD2: 19-27 jun  ·  MD3: 27 jun – 3 jul (simultáneos)

INSERT INTO public.fixtures (grupo, jornada, local_id, visitante_id, fecha_hora, ciudad)
SELECT
  v.grupo,
  v.jornada::SMALLINT,
  t1.id,
  t2.id,
  v.fh::TIMESTAMPTZ,
  v.ciudad
FROM (VALUES
  -- ════════════════════════════════════════
  -- JORNADA 1
  -- ════════════════════════════════════════
  -- Grupo A
  ('A',1,'USA','URU','2026-06-11T21:00:00Z','Los Ángeles'),
  ('A',1,'MAR','HON','2026-06-13T17:00:00Z','Pasadena'),
  -- Grupo B
  ('B',1,'MEX','ARG','2026-06-12T00:00:00Z','Ciudad de México'),
  ('B',1,'SUI','CMR','2026-06-14T17:00:00Z','Guadalajara'),
  -- Grupo C
  ('C',1,'CAN','ENG','2026-06-12T17:00:00Z','Toronto'),
  ('C',1,'IRN','GHA','2026-06-15T17:00:00Z','Vancouver'),
  -- Grupo D
  ('D',1,'BRA','CRO','2026-06-12T20:00:00Z','Miami'),
  ('D',1,'KOR','KSA','2026-06-15T23:00:00Z','Dallas'),
  -- Grupo E
  ('E',1,'FRA','DEN','2026-06-12T23:00:00Z','Dallas'),
  ('E',1,'SEN','PAR','2026-06-16T17:00:00Z','Boston'),
  -- Grupo F
  ('F',1,'ESP','AUS','2026-06-13T20:00:00Z','Nueva York'),
  ('F',1,'NGA','PAN','2026-06-16T23:00:00Z','Pasadena'),
  -- Grupo G
  ('G',1,'GER','COL','2026-06-13T23:00:00Z','Kansas City'),
  ('G',1,'JPN','TUN','2026-06-17T17:00:00Z','Miami'),
  -- Grupo H
  ('H',1,'POR','TUR','2026-06-14T20:00:00Z','Filadelfia'),
  ('H',1,'ECU','NZL','2026-06-17T23:00:00Z','Nueva York'),
  -- Grupo I
  ('I',1,'NED','ITA','2026-06-14T23:00:00Z','San Francisco'),
  ('I',1,'SCO','IRQ','2026-06-18T17:00:00Z','San Francisco'),
  -- Grupo J
  ('J',1,'BEL','AUT','2026-06-15T20:00:00Z','Atlanta'),
  ('J',1,'EGY','MLI','2026-06-18T20:00:00Z','Filadelfia'),
  -- Grupo K
  ('K',1,'SRB','ALG','2026-06-16T20:00:00Z','Los Ángeles'),
  ('K',1,'CRC','UKR','2026-06-18T23:00:00Z','Toronto'),
  -- Grupo L
  ('L',1,'CIV','UZB','2026-06-17T20:00:00Z','Dallas'),
  ('L',1,'SVK','RSA','2026-06-19T17:00:00Z','Vancouver'),

  -- ════════════════════════════════════════
  -- JORNADA 2
  -- ════════════════════════════════════════
  -- Grupo A
  ('A',2,'USA','MAR','2026-06-19T23:00:00Z','Los Ángeles'),
  ('A',2,'URU','HON','2026-06-20T23:00:00Z','Pasadena'),
  -- Grupo B
  ('B',2,'MEX','SUI','2026-06-20T17:00:00Z','Ciudad de México'),
  ('B',2,'ARG','CMR','2026-06-21T20:00:00Z','Monterrey'),
  -- Grupo C
  ('C',2,'CAN','IRN','2026-06-20T20:00:00Z','Toronto'),
  ('C',2,'ENG','GHA','2026-06-22T17:00:00Z','Nueva York'),
  -- Grupo D
  ('D',2,'BRA','KOR','2026-06-21T17:00:00Z','Miami'),
  ('D',2,'CRO','KSA','2026-06-22T23:00:00Z','Kansas City'),
  -- Grupo E
  ('E',2,'FRA','SEN','2026-06-21T23:00:00Z','Dallas'),
  ('E',2,'DEN','PAR','2026-06-23T17:00:00Z','Boston'),
  -- Grupo F
  ('F',2,'ESP','NGA','2026-06-22T20:00:00Z','Filadelfia'),
  ('F',2,'AUS','PAN','2026-06-23T23:00:00Z','Pasadena'),
  -- Grupo G
  ('G',2,'GER','JPN','2026-06-23T20:00:00Z','Los Ángeles'),
  ('G',2,'COL','TUN','2026-06-24T20:00:00Z','Atlanta'),
  -- Grupo H
  ('H',2,'POR','ECU','2026-06-24T17:00:00Z','San Francisco'),
  ('H',2,'TUR','NZL','2026-06-25T17:00:00Z','Miami'),
  -- Grupo I
  ('I',2,'NED','SCO','2026-06-24T23:00:00Z','Dallas'),
  ('I',2,'ITA','IRQ','2026-06-25T23:00:00Z','Filadelfia'),
  -- Grupo J
  ('J',2,'BEL','EGY','2026-06-25T20:00:00Z','Toronto'),
  ('J',2,'AUT','MLI','2026-06-26T20:00:00Z','Pasadena'),
  -- Grupo K
  ('K',2,'SRB','CRC','2026-06-26T17:00:00Z','Vancouver'),
  ('K',2,'ALG','UKR','2026-06-27T17:00:00Z','Los Ángeles'),
  -- Grupo L
  ('L',2,'CIV','SVK','2026-06-26T23:00:00Z','Nueva York'),
  ('L',2,'UZB','RSA','2026-06-27T20:00:00Z','San Francisco'),

  -- ════════════════════════════════════════
  -- JORNADA 3 (partidos simultáneos por grupo)
  -- ════════════════════════════════════════
  -- Grupo A (jun 27 21:00 UTC — simultáneo)
  ('A',3,'USA','HON','2026-06-27T21:00:00Z','Los Ángeles'),
  ('A',3,'URU','MAR','2026-06-27T21:00:00Z','Pasadena'),
  -- Grupo B (jun 28 17:00 UTC — simultáneo)
  ('B',3,'MEX','CMR','2026-06-28T17:00:00Z','Ciudad de México'),
  ('B',3,'ARG','SUI','2026-06-28T17:00:00Z','Monterrey'),
  -- Grupo C (jun 28 21:00 UTC — simultáneo)
  ('C',3,'CAN','GHA','2026-06-28T21:00:00Z','Toronto'),
  ('C',3,'ENG','IRN','2026-06-28T21:00:00Z','Vancouver'),
  -- Grupo D (jun 29 17:00 UTC — simultáneo)
  ('D',3,'BRA','KSA','2026-06-29T17:00:00Z','Miami'),
  ('D',3,'CRO','KOR','2026-06-29T17:00:00Z','Kansas City'),
  -- Grupo E (jun 29 21:00 UTC — simultáneo)
  ('E',3,'FRA','PAR','2026-06-29T21:00:00Z','Dallas'),
  ('E',3,'DEN','SEN','2026-06-29T21:00:00Z','Boston'),
  -- Grupo F (jun 30 17:00 UTC — simultáneo)
  ('F',3,'ESP','PAN','2026-06-30T17:00:00Z','Filadelfia'),
  ('F',3,'AUS','NGA','2026-06-30T17:00:00Z','Pasadena'),
  -- Grupo G (jun 30 21:00 UTC — simultáneo)
  ('G',3,'GER','TUN','2026-06-30T21:00:00Z','Los Ángeles'),
  ('G',3,'COL','JPN','2026-06-30T21:00:00Z','Atlanta'),
  -- Grupo H (jul 1 17:00 UTC — simultáneo)
  ('H',3,'POR','NZL','2026-07-01T17:00:00Z','San Francisco'),
  ('H',3,'TUR','ECU','2026-07-01T17:00:00Z','Miami'),
  -- Grupo I (jul 1 21:00 UTC — simultáneo)
  ('I',3,'NED','IRQ','2026-07-01T21:00:00Z','Dallas'),
  ('I',3,'ITA','SCO','2026-07-01T21:00:00Z','Nueva York'),
  -- Grupo J (jul 2 17:00 UTC — simultáneo)
  ('J',3,'BEL','MLI','2026-07-02T17:00:00Z','Filadelfia'),
  ('J',3,'AUT','EGY','2026-07-02T17:00:00Z','Atlanta'),
  -- Grupo K (jul 2 21:00 UTC — simultáneo)
  ('K',3,'SRB','UKR','2026-07-02T21:00:00Z','Los Ángeles'),
  ('K',3,'ALG','CRC','2026-07-02T21:00:00Z','San Francisco'),
  -- Grupo L (jul 3 17:00 UTC — simultáneo)
  ('L',3,'CIV','RSA','2026-07-03T17:00:00Z','Miami'),
  ('L',3,'UZB','SVK','2026-07-03T17:00:00Z','Dallas')

) AS v(grupo, jornada, local_co, visitante_co, fh, ciudad)
JOIN public.teams t1 ON t1.codigo_pais = v.local_co
JOIN public.teams t2 ON t2.codigo_pais = v.visitante_co
ON CONFLICT (local_id, visitante_id) DO NOTHING;

-- ── 4. Exponer fixtures en API (RLS pública) ─────────────────
ALTER TABLE public.fixtures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fixtures_select_all"
  ON public.fixtures FOR SELECT
  USING (true);

-- Solo service role puede simular/actualizar
CREATE POLICY "fixtures_service_role_all"
  ON public.fixtures FOR ALL
  USING (auth.role() = 'service_role');
