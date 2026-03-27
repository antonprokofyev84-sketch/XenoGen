import { useGameState } from '@/state/useGameState';

import { DialogPanel } from './components/DialogPanel/DialogPanel';
import { ImagePanel } from './components/ImagePanel/ImagePanel';
import { TradeModal } from './components/TradeModal/TradeModal';

import './PoiView.scss';

export const PoiView = () => {
  const isTradeOpen = useGameState((s) => s.interactionSlice.isTradeOpen);

  return (
    <div className="poiView">
      {/* LEFT SECTION: Dialogs and Interactions */}
      <DialogPanel />

      {/* RIGHT SECTION: POI Image */}
      <ImagePanel />

      {/* TRADE MODAL OVERLAY */}
      {isTradeOpen && <TradeModal />}
    </div>
  );
};
