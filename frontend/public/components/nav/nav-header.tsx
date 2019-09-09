import * as React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Extension } from '@console/plugin-sdk/src/typings';
import * as plugins from '../../plugins';
import { RootState } from '../../redux';
import { getActivePerspective } from '../../reducers/ui';
import * as UIActions from '../../actions/ui';
import { history } from '../utils';
import { withRouter } from 'react-router-dom';
import { matchPath } from 'react-router';

type StateProps = {
  activePerspective: string;
  setActivePerspective?: (id: string) => void;
};

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
};

const NavHeader_: React.FC<NavHeaderProps & StateProps> = ({
  setActivePerspective,
  onPerspectiveSelected,
  activePerspective,
}) => {
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);

  const togglePerspectiveOpen = () => {
    setPerspectiveDropdownOpen(!isPerspectiveDropdownOpen);
  };

  const onPerspectiveSelect = (perspective: Extension<any>):void => {
    if (perspective.properties.id !== activePerspective) {
      setActivePerspective(perspective.properties.id);
      history.push(perspective.properties.landingPageURL);
    }

    setPerspectiveDropdownOpen(false);
    onPerspectiveSelected && onPerspectiveSelected();
  };

  const renderToggle = (icon: React.ReactNode, name: string) => (
    <DropdownToggle
      isOpen={isPerspectiveDropdownOpen}
      onToggle={togglePerspectiveOpen}
      iconComponent={CaretDownIcon}
      data-test-id="perspective-switcher-toggle"
    >
      <Title size="md">
        <span className="oc-nav-header__icon">
          {icon}
        </span>
        {name}
      </Title>
    </DropdownToggle>
  );

  const getPerspectiveItems = (perspectives: Extension<any>[]) => {
    return perspectives.map((nextPerspective: Extension<any>) => (
      <DropdownItem
        key={nextPerspective.properties.id}
        onClick={() => onPerspectiveSelect(nextPerspective)}
        isHovered={nextPerspective.properties.id === activePerspective}
      >
        <button autoFocus={nextPerspective.properties.id === activePerspective}>
          <Title size="md">
            <span className="oc-nav-header__icon">
              {nextPerspective.properties.icon}
            </span>
            {nextPerspective.properties.name}
          </Title>
        </button>
      </DropdownItem>
    ));
  };

  const perspectives: Extension<any>[] = plugins.registry.getPerspectives();
  const routePages: Extension<any>[] = plugins.registry.getRoutePages();
  const { icon, name } = perspectives.find((p) => p.properties.id === activePerspective).properties;

  const PerspectiveWatcher = withRouter(props => {
    const { location } = props;

    if (location.pathname === '/') {
      return null;
    }

    const matchedRoutePage = routePages.find(routePage => {
      const paths = Array.isArray(routePage.properties.path) ? routePage.properties.path : [routePage.properties.path];
      const matchedPath = paths.find(path => {
        return matchPath(location.pathname, {
          path,
          exact: routePage.properties.exact,
        });
      });

      if (matchedPath) {
        return true;
      }
    });

    const targetPerspective = (matchedRoutePage && matchedRoutePage.properties.perspective) || 'admin';

    if (activePerspective !== targetPerspective) {
      setActivePerspective(targetPerspective);
    }

    return null;
  });

  return (
    <div className="oc-nav-header">
      <Dropdown
        isOpen={isPerspectiveDropdownOpen}
        toggle={renderToggle(icon, name)}
        autoFocus={false}
        dropdownItems={getPerspectiveItems(perspectives)}
        data-test-id="perspective-switcher-menu"
      />
      <PerspectiveWatcher />
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activePerspective: getActivePerspective(state),
  };
};

export default connect<StateProps, {}, NavHeaderProps>(
  mapStateToProps,
  { setActivePerspective: UIActions.setActivePerspective }
)(
  NavHeader_
);
