import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';

import { isNavItem, Extension, connectToExtensions, NavItem } from '@console/plugin-sdk';

import { createLink } from './items';
import { NavSection } from './section';
import AdminNav from './admin-nav';
import { getActivePerspective } from '../../reducers/ui';
import { RootState } from '../../redux';

type PerspectiveNavProps = {
  perspective: string;
  pluginNavItems: NavItem[];
};

const PerspectiveNav: React.FC<PerspectiveNavProps> = ({ perspective, pluginNavItems }) => {
  // Until admin perspective is contributed through extensions, simply render static `AdminNav`
  if (perspective === 'admin') {
    return <AdminNav />;
  }

  // track sections so that we do not create duplicates
  const renderedSections: string[] = [];

  return (
    <React.Fragment>
      {_.compact(
        pluginNavItems
          .filter(item => item.properties.perspective === perspective)
          .map(item => {
            const { section } = item.properties;
            if (section) {
              if (renderedSections.includes(section)) {
                return;
              }
              renderedSections.push(section);
              return <NavSection title={section} key={section} />;
            }
            return createLink(item, true);
          })
      )}
    </React.Fragment>
  );
};

const mapStateToProps = (state: RootState) => ({
  perspective: getActivePerspective(state),
});

const mapExtensionsToProps = (extensions: Extension[]) => ({
  pluginNavItems: extensions.filter(isNavItem),
});

export default connect(mapStateToProps)(connectToExtensions(mapExtensionsToProps)(PerspectiveNav));
