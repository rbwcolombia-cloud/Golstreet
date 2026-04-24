-- ============================================================
-- GolStreet — 48 equipos FIFA World Cup 2026
-- Ejecutar en Supabase SQL Editor
-- ============================================================

INSERT INTO public.teams (nombre, codigo_pais, bandera_url, precio_base, precio_ipo, factor_riesgo, coeficiente_volatilidad, acciones_total) VALUES

-- ── FAVORITOS (precio alto, baja volatilidad) ──────────────
('Argentina',       'ARG', 'https://flagcdn.com/ar.svg',         1800, 1800, 'bajo',     0.80, 1000000),
('Francia',         'FRA', 'https://flagcdn.com/fr.svg',         1700, 1700, 'bajo',     0.82, 1000000),
('Inglaterra',      'ENG', 'https://flagcdn.com/gb-eng.svg',     1600, 1600, 'bajo',     0.83, 1000000),
('España',          'ESP', 'https://flagcdn.com/es.svg',         1550, 1550, 'bajo',     0.83, 1000000),
('Brasil',          'BRA', 'https://flagcdn.com/br.svg',         1500, 1500, 'bajo',     0.85, 1000000),
('Alemania',        'GER', 'https://flagcdn.com/de.svg',         1450, 1450, 'bajo',     0.87, 1000000),
('Portugal',        'POR', 'https://flagcdn.com/pt.svg',         1400, 1400, 'medio',    0.95, 1000000),

-- ── CONTENDIENTES FUERTES ──────────────────────────────────
('Países Bajos',    'NED', 'https://flagcdn.com/nl.svg',         1200, 1200, 'medio',    1.00, 1000000),
('Bélgica',         'BEL', 'https://flagcdn.com/be.svg',         1100, 1100, 'medio',    1.05, 1000000),
('Italia',          'ITA', 'https://flagcdn.com/it.svg',         1050, 1050, 'medio',    1.05, 1000000),
('Colombia',        'COL', 'https://flagcdn.com/co.svg',          950,  950, 'medio',    1.10, 1000000),
('Uruguay',         'URU', 'https://flagcdn.com/uy.svg',          900,  900, 'medio',    1.10, 1000000),
('Marruecos',       'MAR', 'https://flagcdn.com/ma.svg',          850,  850, 'medio',    1.15, 1000000),
('México',          'MEX', 'https://flagcdn.com/mx.svg',          800,  800, 'medio',    1.15, 1000000),
('EE.UU.',          'USA', 'https://flagcdn.com/us.svg',          780,  780, 'medio',    1.15, 1000000),

-- ── COMPETITIVOS ───────────────────────────────────────────
('Croacia',         'CRO', 'https://flagcdn.com/hr.svg',          750,  750, 'medio',    1.20, 1000000),
('Suiza',           'SUI', 'https://flagcdn.com/ch.svg',          720,  720, 'medio',    1.20, 1000000),
('Dinamarca',       'DEN', 'https://flagcdn.com/dk.svg',          700,  700, 'medio',    1.20, 1000000),
('Turquía',         'TUR', 'https://flagcdn.com/tr.svg',          680,  680, 'alto',     1.30, 1000000),
('Senegal',         'SEN', 'https://flagcdn.com/sn.svg',          650,  650, 'alto',     1.30, 1000000),
('Japón',           'JPN', 'https://flagcdn.com/jp.svg',          630,  630, 'alto',     1.35, 1000000),
('Corea del Sur',   'KOR', 'https://flagcdn.com/kr.svg',          620,  620, 'alto',     1.35, 1000000),
('Austria',         'AUT', 'https://flagcdn.com/at.svg',          600,  600, 'alto',     1.35, 1000000),
('Ecuador',         'ECU', 'https://flagcdn.com/ec.svg',          580,  580, 'alto',     1.38, 1000000),
('Irán',            'IRN', 'https://flagcdn.com/ir.svg',          560,  560, 'alto',     1.40, 1000000),
('Australia',       'AUS', 'https://flagcdn.com/au.svg',          540,  540, 'alto',     1.40, 1000000),
('Egipto',          'EGY', 'https://flagcdn.com/eg.svg',          520,  520, 'alto',     1.42, 1000000),
('Canadá',          'CAN', 'https://flagcdn.com/ca.svg',          500,  500, 'alto',     1.42, 1000000),
('Escocia',         'SCO', 'https://flagcdn.com/gb-sct.svg',      480,  480, 'alto',     1.45, 1000000),
('Nigeria',         'NGA', 'https://flagcdn.com/ng.svg',          460,  460, 'alto',     1.45, 1000000),
('Costa de Marfil', 'CIV', 'https://flagcdn.com/ci.svg',          440,  440, 'alto',     1.48, 1000000),

-- ── SORPRESIVOS / ALTA VOLATILIDAD ─────────────────────────
('Serbia',          'SRB', 'https://flagcdn.com/rs.svg',          420,  420, 'alto',     1.50, 1000000),
('Argelia',         'ALG', 'https://flagcdn.com/dz.svg',          400,  400, 'alto',     1.50, 1000000),
('Paraguay',        'PAR', 'https://flagcdn.com/py.svg',          380,  380, 'alto',     1.52, 1000000),
('Arabia Saudita',  'KSA', 'https://flagcdn.com/sa.svg',          360,  360, 'alto',     1.55, 1000000),
('Camerún',         'CMR', 'https://flagcdn.com/cm.svg',          340,  340, 'alto',     1.55, 1000000),
('Ghana',           'GHA', 'https://flagcdn.com/gh.svg',          320,  320, 'alto',     1.58, 1000000),
('Costa Rica',      'CRC', 'https://flagcdn.com/cr.svg',          300,  300, 'alto',     1.58, 1000000),
('Uzbekistán',      'UZB', 'https://flagcdn.com/uz.svg',          280,  280, 'muy_alto', 1.65, 1000000),

-- ── UNDERDOGS ─────────────────────────────────────────────
('Eslovaquia',      'SVK', 'https://flagcdn.com/sk.svg',          260,  260, 'muy_alto', 1.70, 1000000),
('Ucrania',         'UKR', 'https://flagcdn.com/ua.svg',          250,  250, 'muy_alto', 1.70, 1000000),
('Sudáfrica',       'RSA', 'https://flagcdn.com/za.svg',          240,  240, 'muy_alto', 1.72, 1000000),
('Irak',            'IRQ', 'https://flagcdn.com/iq.svg',          220,  220, 'muy_alto', 1.75, 1000000),
('Túnez',           'TUN', 'https://flagcdn.com/tn.svg',          210,  210, 'muy_alto', 1.75, 1000000),
('Mali',            'MLI', 'https://flagcdn.com/ml.svg',          200,  200, 'muy_alto', 1.78, 1000000),
('Honduras',        'HON', 'https://flagcdn.com/hn.svg',          185,  185, 'muy_alto', 1.80, 1000000),
('Panamá',          'PAN', 'https://flagcdn.com/pa.svg',          170,  170, 'muy_alto', 1.85, 1000000),
('Nueva Zelanda',   'NZL', 'https://flagcdn.com/nz.svg',          150,  150, 'muy_alto', 1.90, 1000000)

ON CONFLICT (codigo_pais) DO UPDATE SET
  nombre                 = EXCLUDED.nombre,
  bandera_url            = EXCLUDED.bandera_url,
  precio_base            = EXCLUDED.precio_base,
  precio_ipo             = EXCLUDED.precio_ipo,
  factor_riesgo          = EXCLUDED.factor_riesgo,
  coeficiente_volatilidad = EXCLUDED.coeficiente_volatilidad,
  acciones_total         = EXCLUDED.acciones_total;
