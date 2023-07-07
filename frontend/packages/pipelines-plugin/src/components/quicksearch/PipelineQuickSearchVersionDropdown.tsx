import * as React from 'react';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { global_palette_green_500 as greenColor } from '@patternfly/react-tokens';
import i18n from 'i18next';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { TektonHubTaskVersion } from '../catalog/apis/tektonHub';
import { isSelectedVersionInstalled } from './pipeline-quicksearch-utils';

interface PipelineQuickSearchVersionDropdownProps {
  selectedVersion: string;
  item: CatalogItem;
  versions: TektonHubTaskVersion[];
  onChange: (key: string) => void;
}

const PipelineQuickSearchVersionDropdown: React.FC<PipelineQuickSearchVersionDropdownProps> = ({
  item,
  versions,
  onChange,
  selectedVersion,
}) => {
  const [isOpen, setOpen] = React.useState(false);
  const toggleIsOpen = React.useCallback(() => setOpen((v) => !v), []);

  if (!versions || versions?.length === 0) {
    return null;
  }
  const versionItems = versions.reduce((acc, { version }) => {
    acc[version.toString()] =
      version === item.data?.latestVersion?.version
        ? i18n.t('pipelines-plugin~{{version}} (latest)', { version })
        : version;
    return acc;
  }, {});
  return (
    <Dropdown
      data-test="task-version"
      className="opp-quick-search-details__version-dropdown"
      dropdownItems={Object.keys(versionItems).map((key) => (
        <DropdownItem
          component="button"
          key={key}
          label={versionItems[key]}
          onClick={(e) => {
            e.stopPropagation();
            onChange(key);
            setOpen(false);
          }}
        >
          <div className="opp-quick-search-details__version-dropdown-item">
            {versionItems[key]}
            {isSelectedVersionInstalled(item, key) && <CheckCircleIcon color={greenColor.value} />}
          </div>
        </DropdownItem>
      ))}
      isOpen={isOpen}
      toggle={
        <DropdownToggle
          isDisabled={versions.length === 1}
          data-test="task-version-toggle"
          onToggle={toggleIsOpen}
        >
          {versionItems[selectedVersion]}
        </DropdownToggle>
      }
    />
  );
};

export default PipelineQuickSearchVersionDropdown;
