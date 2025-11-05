import { characterSelectors, equipmentSelectors, partySelectors } from '@/state/useGameState';
import type { StoreState } from '@/state/useGameState';
import { equipmentFactory } from '@/systems/equipment/equipmentFactory';
import type { CombatStats, CombatUnit } from '@/types/combat.types';
import type { CombatEquipment } from '@/types/combat.types';

const mapCharacterToCombatStats = (state: StoreState, characterId: string): CombatStats => {
  const hp = state.characters.byId[characterId]?.hp;
  const secondary = characterSelectors.selectEffectiveSecondaryStats(characterId)(state);
  const skills = characterSelectors.selectEffectiveSkills(characterId)(state);

  console.log(skills);

  const stats: CombatStats = {
    hp,
    armor: secondary.armor,
    baseMeleeDamage: secondary.damageModifier,
    melee: skills.melee,
    range: skills.range,
    evasion: secondary.evasion,
    initiative: secondary.initiative,
    critChance: secondary.critChance,
  };

  return stats;
};

const getEquipmentForCharacterSnapshot = (
  state: StoreState,
  characterId: string,
): CombatEquipment => {
  const equipment = equipmentSelectors.selectEquipmentByCharacterId(characterId)(state);

  const meleePrimary = equipment.meleePrimary
    ? equipmentFactory.createWeaponInstance(
        equipment.meleePrimary.templateId,
        equipment.meleePrimary.rarity,
      )
    : null;

  const meleeSecondary = equipment.meleeSecondary
    ? equipmentFactory.createWeaponInstance(
        equipment.meleeSecondary.templateId,
        equipment.meleeSecondary.rarity,
      )
    : null;

  // const rangePrimary = equipment.rangePrimary
  //   ? equipmentFactory.createWeaponInstance(
  //       equipment.rangePrimary.templateId,
  //       equipment.rangePrimary.rarity,
  //     )
  //   : null;

  // const rangeSecondary = equipment.rangeSecondary
  //   ? equipmentFactory.createWeaponInstance(
  //       equipment.rangeSecondary.templateId,
  //       equipment.rangeSecondary.rarity,
  //     )
  //   : null;

  // const meleePrimary = equipmentFactory.createWeaponInstance('makeshiftKnife', 'common');
  const rangePrimary = equipmentFactory.createWeaponInstance('beretta92', 'common');
  // const meleeSecondary = null;
  const rangeSecondary = null;

  return {
    meleePrimary,
    meleeSecondary,
    rangePrimary,
    rangeSecondary,
    armor: equipment.armor || null,
    gadget: equipment.gadget || null,
  };
};

export const makeCombatUnitForCharacterSnapshot = (
  state: StoreState,
  characterId: string,
): CombatUnit | null => {
  const character = characterSelectors.selectCharacterById(characterId)(state);
  if (!character) return null;

  const stats = mapCharacterToCombatStats(state, characterId);
  const equipment = getEquipmentForCharacterSnapshot(state, characterId);

  const combatUnit: CombatUnit = {
    instanceId: characterId,
    templateId: character.templateId,
    stats,
    equipment,
    activeWeaponSlot: 'meleePrimary',
    status: 'alive',
    position: 0,
    // TODO: поменять если понадобится
    faction: 'player',
    appearanceVariation: 0,
    level: 0,
    rarity: 'common',
  };

  return JSON.parse(JSON.stringify(combatUnit)) as CombatUnit;
};

export const makeActivePartyCombatUnitsSnapshot = (state: StoreState): CombatUnit[] => {
  const active = partySelectors.selectActivePartyMembers(state);
  const res: CombatUnit[] = [];
  for (const ch of active) {
    const unit = makeCombatUnitForCharacterSnapshot(state, ch.id);
    if (unit) res.push(unit);
  }
  return res;
};
