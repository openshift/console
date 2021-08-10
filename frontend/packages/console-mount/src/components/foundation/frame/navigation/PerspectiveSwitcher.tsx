import * as React from 'react';
import { Dropdown, DropdownToggle, DropdownItem, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { Perspective, ResolvedExtension, useActivePerspective } from '@console/dynamic-plugin-sdk';
import { useOnlyRouteFilledPerspectives } from '../../../perspectives';

import './PerspectiveSwitcher.scss';

const PerspectiveSwitcher: React.FC = () => {
  const [selectedPerspective, setSelectedPerspective] = useActivePerspective();
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const perspectiveExtensions = useOnlyRouteFilledPerspectives();

  const defaultPerspective = perspectiveExtensions.find(
    (perspective) => perspective.properties.default,
  );
  React.useEffect(() => {
    if (defaultPerspective) {
      setSelectedPerspective(defaultPerspective.properties.id);
    }
  }, [defaultPerspective, setSelectedPerspective]);

  // We only want to render a switcher if we have at least two items
  if (perspectiveExtensions?.length < 2) {
    return null;
  }

  const selectPerspective = (perspective: ResolvedExtension<Perspective>) => {
    setIsOpen(false);
    setSelectedPerspective(perspective.properties.id);
  };

  const perspectiveItems = perspectiveExtensions.map((perspective) => (
    <DropdownItem key={perspective.uid} onClick={() => selectPerspective(perspective)}>
      {perspective.properties.icon} {perspective.properties.name}
    </DropdownItem>
  ));

  const activePerspective = !selectedPerspective
    ? defaultPerspective
    : perspectiveExtensions.find(
        (perspective) => perspective.properties.id === selectedPerspective,
      );

  if (!activePerspective) {
    return null;
  }

  return (
    <div className="cm-perspective-switcher">
      <Dropdown
        className="cm-perspective-switcher__dropdown"
        toggle={
          <DropdownToggle
            id="toggle-id"
            className="cm-perspective-switcher__toggle"
            isPlain
            onToggle={() => setIsOpen(!isOpen)}
            toggleIndicator={CaretDownIcon}
          >
            <Title headingLevel="h2" size="md" data-test-id="perspective-switcher-menu-option">
              {activePerspective.properties.icon} {activePerspective.properties.name}
            </Title>
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={perspectiveItems}
      />
    </div>
  );
};

export default PerspectiveSwitcher;
