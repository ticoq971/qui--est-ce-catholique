import type { AttributeKey, CharacterCategory } from '../types';

const MYSTIQUE_IDS = new Set([
  'jean-croix', 'therese-avila', 'catherine-sienne', 'francois-assise',
  'bernadette', 'faustine', 'hildegard', 'padre-pio', 'francois-sales', 'therese-lisieux',
]);

const ROI_IDS = new Set(['david', 'salomon', 'charlemagne', 'louis-ix', 'esther']);

const SIECLE20_IDS = new Set([
  'jean-paul-ii', 'jean-xxiii', 'pie-x', 'leon-xiii', 'benoit-xvi', 'francois',
  'padre-pio', 'faustine', 'maximilian-kolbe', 'oscar-romero',
]);

const SAINTE_IDS = new Set([
  'therese-lisieux', 'jeanne-arc', 'claire', 'bernadette', 'faustine', 'hildegard',
  'rose-lima', 'monica', 'rita', 'lucie', 'perpetue', 'therese-avila', 'catherine-sienne',
]);

export function enrichCharacterAttributes(
  id: string,
  category: CharacterCategory,
  attrs: Record<string, boolean>,
): Record<AttributeKey, boolean> {
  const base = attrs as Record<AttributeKey, boolean>;
  return {
    ...base,
    mystique: base.mystique ?? (category === 'mystique' || MYSTIQUE_IDS.has(id)),
    roi: base.roi ?? ROI_IDS.has(id),
    siecle20: base.siecle20 ?? SIECLE20_IDS.has(id),
    sainte: base.sainte ?? (category === 'sainte' || SAINTE_IDS.has(id)),
  };
}
