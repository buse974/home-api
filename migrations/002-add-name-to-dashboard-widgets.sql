-- Migration: Ajouter la colonne 'name' à dashboard_widgets
-- Date: 2026-02-11
-- Description: Permet de personnaliser le nom d'un widget (sinon concaténation des devices)

ALTER TABLE dashboard_widgets
ADD COLUMN IF NOT EXISTS name VARCHAR(255) NULL DEFAULT NULL;

-- Index pour recherche par nom (optionnel mais utile)
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_name ON dashboard_widgets(name)
WHERE name IS NOT NULL;
