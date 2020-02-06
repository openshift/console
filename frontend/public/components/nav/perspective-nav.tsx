import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash-es';
import { useExtensions, NavItem, isNavItem } from '@console/plugin-sdk';
import { createLink } from './items';
import { NavSection } from './section';
import AdminNav from './admin-nav';
import { getActivePerspective } from '../../reducers/ui';
import { RootState } from '../../redux';

type StateProps = {
  perspective: string;
};

const PerspectiveNav: React.FC<StateProps> = ({ perspective }) => {
  const navItemExtensions = useExtensions<NavItem>(isNavItem);

  const matchingNavItems = React.useMemo(
    () => navItemExtensions.filter((item) => item.properties.perspective === perspective),
    [navItemExtensions, perspective],
  );

  // Until admin perspective is contributed through extensions, simply render static `AdminNav`
  if (perspective === 'admin') {
    return <AdminNav />;
  }

  // track sections so that we do not create duplicates
  const renderedSections: string[] = [];

  return (
    <>
      {_.compact(
        matchingNavItems.map((item) => {
          const { section } = item.properties;
          if (section) {
            if (renderedSections.includes(section)) {
              return;
            }
            renderedSections.push(section);
            return <NavSection title={section} key={section} />;
          }
          return createLink(item, true);
        }),
      )}
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    perspective: getActivePerspective(state),
  };
};

export default connect(mapStateToProps)(PerspectiveNav);
