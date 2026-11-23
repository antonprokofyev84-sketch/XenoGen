import characters from './en/characters.json';
import combat from './en/combat.json';
import interaction from './en/interaction.json';
import inventory from './en/inventory.json';
import world from './en/world.json';

const en = {
  ...interaction,
  ...world,
  ...characters,
  ...inventory,
  ...combat,
};

export default en;
