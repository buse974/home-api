-- Migration: Ajouter la colonne 'category' à widgets
-- Date: 2026-02-11
-- Description: Permet de catégoriser les widgets (switch, action, sensor, media, climate)

ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS category VARCHAR(50) NULL DEFAULT NULL;

-- Index pour recherche par catégorie
CREATE INDEX IF NOT EXISTS idx_widgets_category ON widgets(category)
WHERE category IS NOT NULL;

-- Mettre à jour les widgets existants avec leurs catégories
UPDATE widgets SET category = 'switch' WHERE name IN ('Switch', 'SwitchToggle', 'SwitchNeon');
UPDATE widgets SET category = 'action' WHERE name = 'ActionButton';
