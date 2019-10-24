import * as React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Perspective } from '@console/plugin-sdk';
import * as plugins from '../../plugins';
import { RootState } from '../../redux';
import { stateToFlagsObject, FlagsObject } from '../../reducers/features';
import { getActivePerspective } from '../../reducers/ui';
import * as UIActions from '../../actions/ui';
import { history } from '../utils';

type StateProps = {
  activePerspective: string;
  setActivePerspective?: (id: string) => void;
  flags: FlagsObject;
};

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
};

const NavHeader_: React.FC<NavHeaderProps & StateProps> = ({
  setActivePerspective,
  onPerspectiveSelected,
  activePerspective,
  flags,
}) => {
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);

  const togglePerspectiveOpen = () => {
    setPerspectiveDropdownOpen(!isPerspectiveDropdownOpen);
  };

  const onPerspectiveSelect = (
    event: React.MouseEvent<HTMLLinkElement>,
    perspective: Perspective,
  ): void => {
    event.preventDefault();
    if (perspective.properties.id !== activePerspective) {
      setActivePerspective(perspective.properties.id);
      history.push(perspective.properties.getLandingPageURL(flags));
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
        <span className="oc-nav-header__icon">{icon}</span>
        {name}
      </Title>
    </DropdownToggle>
  );

  const getPerspectiveItems = (perspectives: Perspective[]) => {
    return perspectives.map((nextPerspective: Perspective) => (
      <DropdownItem
        key={nextPerspective.properties.id}
        onClick={(event: React.MouseEvent<HTMLLinkElement>) =>
          onPerspectiveSelect(event, nextPerspective)
        }
        isHovered={nextPerspective.properties.id === activePerspective}
        href="#"
      >
        <Title size="md">
          <span className="oc-nav-header__icon">{nextPerspective.properties.icon}</span>
          {nextPerspective.properties.name}
        </Title>
      </DropdownItem>
    ));
  };

  const perspectives = plugins.registry.getPerspectives();
  const { icon, name } = perspectives.find((p) => p.properties.id === activePerspective).properties;

  return (
    <div className="oc-nav-header">
      <Dropdown
        isOpen={isPerspectiveDropdownOpen}
        toggle={renderToggle(icon, name)}
        dropdownItems={getPerspectiveItems(perspectives)}
        data-test-id="perspective-switcher-menu"
      />
    </div>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activePerspective: getActivePerspective(state),
  flags: stateToFlagsObject(state),
});

export default connect<StateProps, {}, NavHeaderProps>(
  mapStateToProps,
  { setActivePerspective: UIActions.setActivePerspective },
)(NavHeader_);
