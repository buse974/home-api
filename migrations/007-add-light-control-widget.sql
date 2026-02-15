-- Migration: Ajouter le widget LightControl (couleur/blanc + luminosite)
-- Date: 2026-02-15
-- Description: Widget unique pour piloter couleur ou blanc chaud/froid avec slider luminosite

INSERT INTO widgets (
  id,
  name,
  libelle,
  component,
  description,
  icon,
  category,
  requires_device,
  config_schema,
  created_at
)
VALUES (
  'a5ddf714-fb37-475a-8764-5af22dbfbc3c',
  'LightControl',
  'Controle Lumiere',
  'LightControl',
  'Controle couleur ou blanc chaud/froid avec luminosite',
  '🎛️',
  'switch',
  TRUE,
  '{}',
  CURRENT_TIMESTAMP
)
ON CONFLICT (name)
DO UPDATE SET
  libelle = EXCLUDED.libelle,
  component = EXCLUDED.component,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  requires_device = EXCLUDED.requires_device,
  config_schema = EXCLUDED.config_schema;
