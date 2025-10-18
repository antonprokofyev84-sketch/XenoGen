import { Button } from '@/components/Button/Button';

import './Combat.scss';

export const Combat = () => {
  return (
    <div className="combatScreen">
      {/* Левая колонка для кнопок управления */}
      <aside className="controlsSidebar">
        <h3>Actions</h3>
        <div className="actions-grid">
          <Button variant="outline" color="green">
            Ability 1
          </Button>
          <Button variant="outline" color="green">
            Ability 2
          </Button>
          <Button variant="outline" color="blue">
            Ability 3
          </Button>
          <Button variant="outline" color="blue">
            Ability 4
          </Button>
          <Button variant="solid" color="yellow" disabled>
            Item
          </Button>
          <Button variant="solid" color="white">
            Defend
          </Button>
        </div>
        <div className="end-turn-container">
          <Button variant="ghost" color="red">
            End Turn
          </Button>
        </div>
      </aside>

      {/* Центральная область для боевых зон */}
      <main className="combatArenas">
        <section className="enemyArea">
          <div className="areaLabel">Enemies</div>
          {/* Здесь будут карточки врагов */}
        </section>
        <section className="playerArea">
          <div className="areaLabel">Allies</div>
          {/* Здесь будут карточки группы игрока */}
        </section>
      </main>

      {/* Правая колонка для шкалы инициативы */}
      <aside className="initiativeTracker">
        <h3>Initiative</h3>
        {/* Здесь будет список участников боя */}
      </aside>
    </div>
  );
};
