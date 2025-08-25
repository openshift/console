import * as React from 'react';
import { Button, Split, SplitItem, Tooltip } from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import { getIcon, getIcons } from '@console/internal/components/catalog/catalog-item-icon';
import { ConsoleSelect } from '@console/internal/components/utils/console-select';
import { CustomIconModal } from './CustomIconModal';

import './IconDropdown.scss';

export type IconDropdownProps = {
  runtimeIcon?: string;
  onRuntimeIconChanged?: (value: string) => void;
  customIcon?: string;
  onCustomIconChanged?: (url: string) => void;
};

type IconProps = {
  label: string;
  url: string;
};

const Icon: React.FC<IconProps> = ({ label, url }) => (
  <div className="pf-v6-u-display-flex pf-v6-u-align-items-center">
    <img src={url} width="28" height="28" alt="" className="odc-icon-bg pf-v6-u-mr-sm" />
    {label}
  </div>
);

const iconLabelAutocompleteFilter = (text: string, item: React.ReactElement<IconProps>) =>
  fuzzy(text, item.props.label);

const IconDropdown: React.FC<IconDropdownProps> = ({
  runtimeIcon,
  onRuntimeIconChanged,
  customIcon,
  onCustomIconChanged,
}) => {
  const { t } = useTranslation('devconsole');

  const title = React.useMemo<React.ReactElement>(() => {
    if (customIcon) {
      return <Icon label={t('Custom icon')} url={customIcon} />;
    }

    const icon = getIcon(runtimeIcon || 'openshift');
    return icon ? (
      <Icon label={icon.label} url={icon.url} />
    ) : (
      <span className="btn-dropdown__item--placeholder">{t('Select an icon')}</span>
    );
  }, [customIcon, runtimeIcon, t]);

  const items = React.useMemo<Record<string, React.ReactElement>>(() => {
    const options: Record<string, React.ReactElement> = {};

    getIcons().forEach(({ label, url }) => {
      options[label] = <Icon label={label} url={url} />;
    });

    return options;
  }, []);

  const [customIconModalIsOpen, setCustomIconModalOpen] = React.useState(false);

  return (
    <>
      <Split hasGutter>
        <SplitItem isFilled>
          <ConsoleSelect
            title={title}
            items={items}
            alwaysShowTitle
            autocompletePlaceholder={t('Select an icon')}
            autocompleteFilter={iconLabelAutocompleteFilter}
            isFullWidth
            className="odc-icon-dropdown"
            onChange={(value: string) => {
              // runtime icon and custom icon are mutually exclusive
              onRuntimeIconChanged(value);
              onCustomIconChanged('');
            }}
            selectedKey={runtimeIcon || 'openshift'}
          />
        </SplitItem>
        <SplitItem>
          <Tooltip content={t('Add custom icon')}>
            <Button
              aria-label={t('Add custom icon')}
              data-test="add-custom-icon"
              className="pf-v6-u-align-items-center pf-v6-u-h-100"
              icon={<UploadIcon />}
              onClick={() => setCustomIconModalOpen(true)}
              variant="control"
            />
          </Tooltip>
        </SplitItem>
      </Split>
      <CustomIconModal
        isModalOpen={customIconModalIsOpen}
        setModalOpen={setCustomIconModalOpen}
        customIcon={customIcon}
        onCustomIconChanged={(value) => {
          // runtime icon and custom icon are mutually exclusive
          onRuntimeIconChanged('');
          onCustomIconChanged(value);
        }}
      />
    </>
  );
};

export default IconDropdown;
