-- ============================================================
-- Migración 005: Reset de precios pre-torneo
-- Los precios de league_assets se movieron por noticias deportivas
-- antes de que comenzara el Mundial (bug: faltaba gate de fecha).
-- Esta migración devuelve todos los precios a su valor IPO correcto
-- y limpia el historial de movimientos causados por noticias.
-- ============================================================

-- 1. Resetear precio_actual y precio_apertura_dia al precio IPO del equipo
UPDATE public.league_assets la
SET
  precio_actual        = t.precio_ipo,
  precio_apertura_dia  = t.precio_ipo,
  ultimo_update        = now()
FROM public.teams t
WHERE la.team_id = t.id;

-- 2. Eliminar entradas en price_history causadas por noticias pre-torneo
DELETE FROM public.price_history
WHERE motivo = 'noticia'
  AND timestamp < '2026-06-11T21:00:00Z';

-- 3. Marcar como procesadas todas las noticias pendientes del feed
--    (evitar que se reprocesen con el bug corregido)
UPDATE public.news_feed
SET procesado = true, procesado_en = now()
WHERE procesado = false;
