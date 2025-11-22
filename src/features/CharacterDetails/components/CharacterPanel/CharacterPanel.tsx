import './CharacterPanel.scss';

interface CharacterPanelProps {
  characterId: string;
}

export const CharacterPanel = ({ characterId }: CharacterPanelProps) => {
  return (
    <div className="characterPanel">
      <h3>CharacterPanel</h3>
      <p>Selected Character ID: {characterId}</p>
      {/* Здесь в будущем будут слоты экипировки и статы */}
    </div>
  );
};
