import * as React from 'react';
import { PageHeader, PageHeaderTools } from '@patternfly/react-core';

type MastheadProps = {
  navOpen: boolean;
  onNavToggle: (navState: boolean) => void;
};

const Masthead: React.FC<MastheadProps> = ({ navOpen, onNavToggle }) => {
  return (
    <PageHeader
      logo="Logo"
      headerTools={<PageHeaderTools>header-tools</PageHeaderTools>}
      showNavToggle
      isNavOpen={navOpen}
      onNavToggle={() => onNavToggle(!navOpen)}
    />
  );
};

export default Masthead;
