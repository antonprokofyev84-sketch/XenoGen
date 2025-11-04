import { WeaponSelector } from '../WeaponSelector/WeaponSelector';

import './CombatSidebar.scss';

export const CombatSidebar = () => {
  return (
    <aside className="controlsSidebar">
      <h3>Actions</h3>

      <WeaponSelector />
    </aside>
  );
};
