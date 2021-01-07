import * as React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Perspective } from '@console/plugin-sdk';
import { getPerspectives } from '../../hypercloud/perspectives';
import { RootState } from '../../redux';
import { featureReducerName, getFlagsObject, FlagsObject } from '../../reducers/features';
import { getActivePerspective, getConsoleMode } from '../../reducers/ui';
import * as UIActions from '../../actions/ui';
import { history } from '../utils';
import ClusterDropdown from '../hypercloud/nav/cluster-dropdown';
import { RadioGroup } from '@console/internal/components/radio'; // 임시 - single only mode 보여주기용

type StateProps = {
  activePerspective: string;
  setActivePerspective?: (id: string) => void;
  consoleMode: string;
  setConsoleMode?: (mode: string) => void;
  flags: FlagsObject;
};

export type NavHeaderProps = {
  onPerspectiveSelected: () => void;
  onClusterSelected: () => void;
};

const NavHeader_: React.FC<NavHeaderProps & StateProps> = ({
  setActivePerspective,
  onPerspectiveSelected,
  activePerspective,
  onClusterSelected,
  consoleMode,
  setConsoleMode,
  flags,
}) => {
  const [isPerspectiveDropdownOpen, setPerspectiveDropdownOpen] = React.useState(false);

  const togglePerspectiveOpen = React.useCallback(() => {
    setPerspectiveDropdownOpen(!isPerspectiveDropdownOpen);
  }, [isPerspectiveDropdownOpen]);

  const onPerspectiveSelect = React.useCallback(
    (event: React.MouseEvent<HTMLLinkElement>, perspective: Perspective): void => {
      event.preventDefault();
      if (perspective.properties.id !== activePerspective) {
        setActivePerspective(perspective.properties.id);
        history.push(perspective.properties.getLandingPageURL(flags));
      }

      setPerspectiveDropdownOpen(false);
      onPerspectiveSelected && onPerspectiveSelected();
    },
    [activePerspective, flags, onPerspectiveSelected, setActivePerspective],
  );

  const renderToggle = React.useCallback(
    (icon: React.ReactNode, name: string) => (
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
    ),
    [isPerspectiveDropdownOpen, togglePerspectiveOpen],
  );

  const getPerspectiveItems = React.useCallback(
    (perspectives: Perspective[]) => {
      return perspectives.map((nextPerspective: Perspective) => (
        <DropdownItem
          key={nextPerspective.properties.id}
          onClick={(event: React.MouseEvent<HTMLLinkElement>) =>
            onPerspectiveSelect(event, nextPerspective)
          }
          isHovered={nextPerspective.properties.id === activePerspective}
          component="button"
        >
          <Title size="md">
            <span className="oc-nav-header__icon">{nextPerspective.properties.icon}</span>
            {nextPerspective.properties.name}
          </Title>
        </DropdownItem>
      ));
    },
    [activePerspective, onPerspectiveSelect],
  );

  const perspectives = React.useMemo(() => getPerspectives(), []);
  const { icon, name } = React.useMemo(
    () => perspectives.find((p) => p.properties.id === activePerspective).properties,
    [activePerspective, perspectives],
  );

  return (
    <>
      <RadioGroup
        label="Console Mode:"
        currentValue={consoleMode}
        items={[
          {
            value: 'mc',
            title: 'Multi Cluster Mode',
          },
          {
            value: 'hc',
            title: 'Single Cluster Mode',
          },
        ]}
        onChange={({ currentTarget }) => { setConsoleMode(currentTarget.value); setActivePerspective(currentTarget.value) }}
      />
      {consoleMode === "mc" && (
        <div className="oc-nav-header">
          <h4>Application</h4>
          <Dropdown
            isOpen={isPerspectiveDropdownOpen}
            toggle={renderToggle(icon, name)}
            dropdownItems={getPerspectiveItems(perspectives)}
            data-test-id="perspective-switcher-menu"
          />
          {activePerspective == "hc" &&
            <>
              <h4>Cluster</h4>
              <ClusterDropdown onClusterSelected={onClusterSelected} />
            </>
          }
        </div>
      )
      }
    </>
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  activePerspective: getActivePerspective(state),
  consoleMode: getConsoleMode(state),
  flags: getFlagsObject(state),
});

export default connect<StateProps, {}, NavHeaderProps, RootState>(
  mapStateToProps,
  { setActivePerspective: UIActions.setActivePerspective, setConsoleMode: UIActions.setConsoleMode },
  null,
  {
    areStatesEqual: (next, prev) =>
      next[featureReducerName] === prev[featureReducerName] &&
      getActivePerspective(next) === getActivePerspective(prev) &&
      getConsoleMode(next) === getConsoleMode(prev),
  },
)(NavHeader_);
