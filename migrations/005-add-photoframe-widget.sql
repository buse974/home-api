-- Migration: Ajouter le widget PhotoFrame au catalogue
-- Date: 2026-02-14
-- Description: Crée (ou met à jour) le widget cadre photo sans dépendance device

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
  'd76d9b4a-cd79-4ff8-8e23-5cb55a70f40f',
  'PhotoFrame',
  'Cadre Photo',
  'PhotoFrame',
  'Affiche un diaporama de photos',
  '🖼️',
  'media',
  FALSE,
  '{"photos":{"type":"array","required":false,"default":[],"label":"Photos"},"intervalSeconds":{"type":"number","required":true,"default":6,"label":"Intervalle (secondes)"}}',
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
