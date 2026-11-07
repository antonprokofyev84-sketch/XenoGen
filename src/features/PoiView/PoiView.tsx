import { useState } from 'react';

import { GameHud, GameSystemMenu } from '@/components/GameHud/GameHud';
import { interactionSelectors, useGameState } from '@/state/useGameState';

import { InteractionHistory } from './components/InteractionHistory';
import { PoiInteractionPanel } from './components/PoiInteractionPanel';
import { NpcFigure, NpcPortraitGrid, PoiNavigation } from './components/PoiSceneParts';
import { SceneViewport } from './components/SceneViewport';
import { TradeModal } from './components/TradeModal/TradeModal';

import './PoiView.scss';

export const PoiView = () => {
  const [historyOpen, setHistoryOpen] = useState(false);
  const interaction = useGameState(interactionSelectors.selectCurrentInteraction);
  const presentation = useGameState(interactionSelectors.selectPresentation);
  const options = useGameState(interactionSelectors.selectInteractionOptions);
  const enterSlot = useGameState((state) => state.interactionSlice.actions.enterSlotContext);
  const isTradeOpen = useGameState((state) => state.interactionSlice.isTrading);
  const isReading = interaction?.reading.mode === 'narrative';
  const actions = [
    ...options.actions.frame,
    ...options.actions.poi,
    ...options.actions.slot,
    ...options.actions.personal,
    ...options.actions.quest,
  ];
  if (!interaction) return null;
  return (
    <div className="poiView">
      <SceneViewport>
        <div
          className="poiBackground"
          style={{
            backgroundImage: presentation.background
              ? `url("${presentation.background}")`
              : undefined,
          }}
        />
        <GameHud locationId={interaction.poiId}>
          <PoiNavigation navigation={options.navigation} disabled={isReading} />
        </GameHud>
        <PoiInteractionPanel
          key={`${interaction.poiId}/${interaction.npcId ?? ''}/${interaction.activeFrameId}/${interaction.reading.mode}`}
          interaction={interaction}
          presentation={presentation}
          actions={actions}
          navigation={options.navigation}
          suspended={historyOpen || isTradeOpen}
          onHistory={() => setHistoryOpen(true)}
        />
        {presentation.figure && <NpcFigure figure={presentation.figure} />}
        {presentation.showPortraits && (
          <NpcPortraitGrid
            key={`${interaction.poiId}/${interaction.npcId ?? ''}`}
            slots={presentation.portraits}
            selectedNpcId={interaction.npcId}
            disabled={isReading || !presentation.isRoot}
            onSelect={enterSlot}
          />
        )}
        <GameSystemMenu />
      </SceneViewport>
      {historyOpen && (
        <InteractionHistory log={interaction.log} onClose={() => setHistoryOpen(false)} />
      )}
      {isTradeOpen && <TradeModal />}
    </div>
  );
};
