import * as React from 'react';
import { Page } from '@patternfly/react-core';
import { PageLoader } from '../loading';
import Masthead from './frame/Masthead';
import Navigation from './frame/Navigation';

type PageFrameProps = {
  children: React.ReactNode;
};

const PageFrame: React.FC<PageFrameProps> = ({ children }) => {
  const [navOpen, setNavOpen] = React.useState<boolean>(true);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Page
        header={<Masthead navOpen={navOpen} onNavToggle={setNavOpen} />}
        sidebar={<Navigation navOpen={navOpen} />}
      >
        <React.Suspense fallback={<PageLoader />}>{children}</React.Suspense>
      </Page>
    </div>
  );
};

export default PageFrame;
