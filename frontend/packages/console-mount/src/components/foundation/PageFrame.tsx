import * as React from 'react';
import { Page, SkipToContent } from '@patternfly/react-core';
import { useLocation } from 'react-router-dom';
import { PageLoader } from '../loading';
import Masthead from './frame/Masthead';
import Navigation from './frame/Navigation';

type PageFrameProps = {
  children: React.ReactNode;
};

const PageFrame: React.FC<PageFrameProps> = ({ children }) => {
  const location = useLocation();
  const [navOpen, setNavOpen] = React.useState<boolean>(true);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Page
        header={<Masthead navOpen={navOpen} onNavToggle={setNavOpen} />}
        sidebar={<Navigation navOpen={navOpen} />}
        skipToContent={
          <SkipToContent href={`${location.pathname}${location.search}#content`}>
            Skip to Content
          </SkipToContent>
        }
      >
        <React.Suspense fallback={<PageLoader />}>{children}</React.Suspense>
      </Page>
    </div>
  );
};

export default PageFrame;
