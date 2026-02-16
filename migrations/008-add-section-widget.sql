-- Migration: Ajouter le widget Section (zone coloree transparente)
-- Date: 2026-02-16
-- Description: Bloc visuel transparent pour organiser le dashboard par zones

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
  'b8e1c3a5-2f49-4d8a-9c71-6e3f0a8b5d12',
  'Section',
  'Section',
  'Section',
  'Zone coloree transparente pour organiser visuellement le dashboard',
  '🟦',
  'layout',
  FALSE,
  '{"sectionColor": "white"}',
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
