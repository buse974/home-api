-- Migration: Ajouter la colonne 'requires_device' à widgets
-- Date: 2026-02-13
-- Description: Permet d'indiquer si un widget exige au moins un device

ALTER TABLE widgets
ADD COLUMN IF NOT EXISTS requires_device BOOLEAN NOT NULL DEFAULT TRUE;

-- Les widgets texte n'ont pas besoin de device
UPDATE widgets
SET requires_device = FALSE
WHERE name IN ('TextTicker');
