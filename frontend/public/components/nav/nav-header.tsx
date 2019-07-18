import * as React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Extension, isPerspective, Perspective } from '@console/plugin-sdk/src/typings';
import { RootState } from '../../redux';
import { getActivePerspective } from '../../reducers/ui';
import * as UIActions from '../../actions/ui';
import { history } from '../utils';
import { connectToExtensions } from '@console/plugin-sdk';

type StateProps = {
  activePerspective: string;
  setActivePerspective?: (id: string) => void;
};

type NavHeaderProps = {
  onPerspectiveSelected: () => void;
};

type NavHeaderExtensionProps = {
  pluginPerspectives: Perspective[];
}

const NavHeader_: React.FC<NavHeaderProps & StateProps & NavHeaderExtensionProps> = ({
  setActivePerspective,
  onPerspectiveSelected,
  activePerspective,
  pluginPerspectives,
}) => {
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);

  const togglePerspectiveOpen = () => {
    setPerspectiveDropdownOpen(!isPerspectiveDropdownOpen);
  };

  const onPerspectiveSelect = (perspective: Extension):void => {
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

  const getPerspectiveItems = (perspectives: Extension[]) => {
    return perspectives.map((nextPerspective: Extension) => (
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

  const { icon, name } = pluginPerspectives.find((p) => p.properties.id === activePerspective).properties;

  return (
    <div className="oc-nav-header">
      <Dropdown
        isOpen={isPerspectiveDropdownOpen}
        toggle={renderToggle(icon, name)}
        autoFocus={false}
        dropdownItems={getPerspectiveItems(pluginPerspectives)}
        data-test-id="perspective-switcher-menu"
      />
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activePerspective: getActivePerspective(state),
  };
};

const mapExtensionsToProps = (extensions: Extension[]) => ({
  pluginPerspectives: extensions.filter(isPerspective),
});

export default connect<StateProps, {}, NavHeaderProps>(
  mapStateToProps,
  { setActivePerspective: UIActions.setActivePerspective }
)(
  connectToExtensions<NavHeaderExtensionProps, NavHeaderProps>(mapExtensionsToProps)(NavHeader_)
);
