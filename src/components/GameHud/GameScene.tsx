import type { ReactNode } from 'react';

import './GameScene.scss';

export function GameScene({ children }: { children: ReactNode }) {
  return (
    <div className="poiViewport">
      <div className="poiScene poiTheme">{children}</div>
    </div>
  );
}
