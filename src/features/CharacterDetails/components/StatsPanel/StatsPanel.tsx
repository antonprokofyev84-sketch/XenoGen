import { useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import textData from '@/locales/en.json';
import { characterSelectors } from '@/state/gameSlices/characters';
import { useGameState } from '@/state/useGameState';

import './StatsPanel.scss';

interface StatsPanelProps {
  characterId: string;
}

// Хелпер для локализации
const getStatLabel = (category: 'mainStats' | 'secondaryStats' | 'skills', key: string) => {
  // @ts-ignore
  return textData[category]?.[key] || key;
};

const StatRow = ({ label, value }: { label: string; value: number }) => (
  <div className="statRow">
    <span className="label">{label}</span>
    <span className="value">{Math.round(value)}</span>
  </div>
);

export const StatsPanel = ({ characterId }: StatsPanelProps) => {
  // Достаем эффективные статы (база + экипировка + трейты)
  const mainStats = useGameState(
    useShallow(characterSelectors.selectEffectiveMainStats(characterId)),
  );
  const secondaryStats = useGameState(
    useShallow(characterSelectors.selectEffectiveSecondaryStats(characterId)),
  );
  const skills = useGameState(useShallow(characterSelectors.selectEffectiveSkills(characterId)));

  // Мемоизируем списки ключей
  const mainStatKeys = useMemo(() => Object.keys(mainStats || {}), [mainStats]);

  // Для вторичных статов задаем конкретный порядок для красоты
  const secStatKeys = [
    'maxHp',
    'maxStamina',
    'armor',
    'initiative',
    'critChance',
    'meleeAttackPower',
    'evasion',
  ];

  const skillKeys = useMemo(() => Object.keys(skills || {}), [skills]);

  return (
    <div className="statsPanel">
      <div className="panelHeader">
        {/* Имя убрали, оставили только общий заголовок */}
        <h3>Attributes & Skills</h3>
      </div>

      <div className="scrollableContent">
        {/* ВЕРХНИЙ РЯД: Main Stats + Secondary Stats */}
        <div className="statsRowLayout">
          {/* --- MAIN STATS --- */}
          <div className="statSection">
            <div className="sectionTitle">{textData.characterCreation.mainStatsTitle}</div>
            {mainStatKeys.map((key) => (
              <StatRow
                key={key}
                label={getStatLabel('mainStats', key)}
                value={mainStats[key as keyof typeof mainStats]}
              />
            ))}
          </div>

          {/* --- SECONDARY STATS --- */}
          <div className="statSection">
            <div className="sectionTitle">{textData.characterCreation.secondaryStatsTitle}</div>
            {secStatKeys.map((key) => {
              const val = secondaryStats[key as keyof typeof secondaryStats];
              if (val === undefined) return null;
              return <StatRow key={key} label={getStatLabel('secondaryStats', key)} value={val} />;
            })}
          </div>
        </div>

        {/* --- SKILLS (Снизу во всю ширину) --- */}
        <div className="statSection">
          <div className="sectionTitle">{textData.characterCreation.skillsTitle}</div>
          {skillKeys.map((key) => (
            <StatRow
              key={key}
              label={getStatLabel('skills', key)}
              value={skills[key as keyof typeof skills]}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
