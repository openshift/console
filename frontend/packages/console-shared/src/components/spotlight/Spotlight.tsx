import * as React from 'react';
import InteractiveSpotlight from './InteractiveSpotlight';
import StaticSpotlight from './StaticSpotlight';

type SpotlightProps = {
  selector: string;
  interactive?: boolean;
};

const Spotlight: React.FC<SpotlightProps> = ({ selector, interactive }) => {
  const element = React.useMemo(() => document.querySelector(selector), [selector]);
  if (!element) return null;
  return interactive ? (
    <InteractiveSpotlight element={element} />
  ) : (
    <StaticSpotlight element={element} />
  );
};

export default Spotlight;
