import { DialogPanel } from './components/DialogPanel/DialogPanel';
import { ImagePanel } from './components/ImagePanel/ImagePanel';

import './PoiView.scss';

export const PoiView = () => {
  return (
    <div className="poiView">
      {/* LEFT SECTION: Dialogs and Interactions */}
      <DialogPanel />

      {/* RIGHT SECTION: POI Image */}
      <ImagePanel />
    </div>
  );
};
