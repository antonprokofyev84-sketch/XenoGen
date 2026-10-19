/**
 * Канонические идентификаторы авторского контента и runtime-объектов.
 *
 * Все ID остаются строковыми алиасами: они приходят из ключей реестров и из
 * initial-данных, а не генерируются рантаймом. Алиасы существуют ради
 * читаемости сигнатур, а не ради номинальной типизации.
 */

/** Клетка фиксированной карты. Формат ID — `{col}-{row}`. */
export type CellId = string;

/** Конкретный экземпляр POI в runtime-дереве мира. */
export type PoiId = string;

/** Ключ definition в `POI_TEMPLATES`. Для уникального POI обычно совпадает с его `poiId`. */
export type PoiTemplateId = string;

/** Локальный ID slot внутри POI template. */
export type SlotId = string;

export type NpcId = string;

export type FactionId = string;

/** Персонаж, способный быть speaker в narrative: протагонист, спутник или NPC. */
export type CharacterId = string;

export type ItemId = string;

export type EnemyTypeId = string;

/**
 * Ключ в `INITIAL_FRAMES`.
 *
 * Грамматика: `templateId[/slotId][:framePath]`, поэтому `/` и `:` не
 * используются внутри `templateId`, `slotId` и сегментов `framePath`.
 */
export type FrameId = string;

export type ActionId = string;

export type InterceptorId = string;

export type QuestId = string;

export type QuestStageId = string;

/**
 * Владелец квестового контента: конкретный NPC либо конкретный POI.
 * Slot владельцем не является.
 */
export type QuestTargetId = NpcId | PoiId;
