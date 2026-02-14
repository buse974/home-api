-- Migration: Ajouter deux widgets sliders pour lumiere
-- Date: 2026-02-14
-- Description: Ajoute ColorSlider et WhiteSlider au catalogue widgets

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
  '9f7ef8de-1901-458b-ac40-e8d9ce99de1a',
  'ColorSlider',
  'Slider Couleur',
  'ColorSlider',
  'Controle la couleur neon de la lumiere',
  '🎨',
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
  'cd02aee1-b2e1-4d71-b0f7-66d14d4fbcf1',
  'WhiteSlider',
  'Slider Blanc',
  'WhiteSlider',
  'Controle le blanc chaud/froid de la lumiere',
  '🤍',
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
