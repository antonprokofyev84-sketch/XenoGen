import { PoiPreview } from '@/features/PoiPreview/PoiPreview';

import { BottomBar } from './components/BottomBar/BottomBar';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { MainPanel } from './components/MainPanel/MainPanel';

import './StrategicMap.scss';

export const StrategicMap = () => {
  console.log('Rendering StrategicMap');

  return (
    <div className="strategicMapContainer">
      <LeftPanel />
      <MainPanel />
      <BottomBar />
      {/* <PoiPreview /> */}
    </div>
  );
};
