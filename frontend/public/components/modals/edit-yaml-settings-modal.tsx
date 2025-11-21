import { CodeEditorControl } from '@patternfly/react-code-editor';
import { createIcon } from '@patternfly/react-icons/dist/esm/createIcon';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import {
  Content,
  Flex,
  FlexItem,
  Modal,
  ModalBody,
  ModalHeader,
  Split,
  SplitItem,
  Switch,
} from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
  SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
  SHOW_YAML_EDITOR_STICKY_SCROLL_USER_SETTING_KEY,
  SHOW_YAML_EDITOR_STICKY_SCROLL_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants/common';

/**!
 * Font Awesome Free 6.7.2 - https://fontawesome.com
 * License - https://fontawesome.com/license/free
 * Copyright 2025 Fonticons, Inc.
 */
const IBeamCursorIcon = createIcon({
  name: 'IBeamCursorIcon',
  width: 256,
  height: 512,
  svgPath:
    'M.1 29.3C-1.4 47 11.7 62.4 29.3 63.9l8 .7C70.5 67.3 96 95 96 128.3L96 224l-32 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l32 0 0 95.7c0 33.3-25.5 61-58.7 63.8l-8 .7C11.7 449.6-1.4 465 .1 482.7s16.9 30.7 34.5 29.2l8-.7c34.1-2.8 64.2-18.9 85.4-42.9c21.2 24 51.2 40 85.4 42.9l8 .7c17.6 1.5 33.1-11.6 34.5-29.2s-11.6-33.1-29.2-34.5l-8-.7C185.5 444.7 160 417 160 383.7l0-95.7 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-32 0 0-95.7c0-33.3 25.5-61 58.7-63.8l8-.7c17.6-1.5 30.7-16.9 29.2-34.5S239-1.4 221.3 .1l-8 .7C179.2 3.6 149.2 19.7 128 43.7c-21.2-24-51.2-40-85.4-42.9l-8-.7C17-1.4 1.6 11.7 .1 29.3z',
});

/**!
 * Font Awesome Free 6.7.2 - https://fontawesome.com
 * License - https://fontawesome.com/license/free
 * Copyright 2025 Fonticons, Inc.
 */
const ComputerMouseIcon = createIcon({
  name: 'ComputerMouseIcon',
  width: 384,
  height: 512,
  svgPath:
    'M0 192l176 0L176 0 160 0C71.6 0 0 71.6 0 160l0 32zm0 32L0 352c0 88.4 71.6 160 160 160l64 0c88.4 0 160-71.6 160-160l0-128-192 0L0 224zm384-32l0-32C384 71.6 312.4 0 224 0L208 0l0 192 176 0z',
});

interface ConfigModalItemProps {
  title: string;
  description: string;
  checked?: boolean;
  setChecked: (checked: boolean) => void;
  Icon?: React.ComponentType;
}

const ConfigModalItem: React.FCC<ConfigModalItemProps> = ({
  title,
  description,
  checked,
  setChecked,
  Icon = CogIcon,
}) => {
  const { t } = useTranslation('public');

  return (
    <Split hasGutter>
      <SplitItem isFilled>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          spaceItems={{ default: 'spaceItemsMd' }}
          style={{ flexWrap: 'nowrap' }}
        >
          <FlexItem>
            <Icon />
          </FlexItem>
          <FlexItem>
            <strong className="pf-v6-u-font-weight-bold">{title}</strong>
            <Content component="p">{description}</Content>
          </FlexItem>
        </Flex>
      </SplitItem>
      <SplitItem style={{ whiteSpace: 'nowrap' }}>
        <Switch
          id={title}
          isReversed
          label={checked ? t('On') : t('Off')}
          data-checked-state={checked}
          onChange={(_, c) => {
            setChecked(c);
          }}
          aria-label={title}
          className="pf-v6-u-mt-sm"
          isChecked={checked}
        />
      </SplitItem>
    </Split>
  );
};

const TooltipConfigItem = () => {
  const { t } = useTranslation('public');
  const [showTooltips, setShowTooltips] = useUserSettingsCompatibility(
    SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
    SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
    true,
  );

  return (
    <ConfigModalItem
      title={t('Tooltips')}
      description={t('Show tooltips for Resource and Field names and definitions.')}
      setChecked={setShowTooltips}
      checked={showTooltips}
      Icon={IBeamCursorIcon}
    />
  );
};

const StickyScrollConfigItem = () => {
  const { t } = useTranslation('public');
  const [showStickyScroll, setShowStickyScroll] = useUserSettingsCompatibility(
    SHOW_YAML_EDITOR_STICKY_SCROLL_USER_SETTING_KEY,
    SHOW_YAML_EDITOR_STICKY_SCROLL_LOCAL_STORAGE_KEY,
    true,
  );

  return (
    <ConfigModalItem
      title={t('Sticky scroll')}
      description={t('Stick scopes to the top of the editor so they are always visible.')}
      setChecked={setShowStickyScroll}
      checked={showStickyScroll}
      Icon={ComputerMouseIcon}
    />
  );
};

const EDIT_YAML_SETTINGS_MODAL_ID = 'edit-yaml-settings-modal';

interface EditYamlSettingsModalProps {
  appendTo?: React.ComponentProps<typeof Modal>['appendTo'];
}

export const EditYamlSettingsModal: React.FCC<EditYamlSettingsModalProps> = ({ appendTo }) => {
  const { t } = useTranslation('public');
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(!isModalOpen)}
        ouiaId={EDIT_YAML_SETTINGS_MODAL_ID}
        variant="small"
        appendTo={appendTo}
        aria-labelledby={`${EDIT_YAML_SETTINGS_MODAL_ID}-title`}
        aria-describedby={`${EDIT_YAML_SETTINGS_MODAL_ID}-body`}
      >
        <ModalHeader
          title={t('Editor settings')}
          labelId={`${EDIT_YAML_SETTINGS_MODAL_ID}-title`}
        />
        <ModalBody id={`${EDIT_YAML_SETTINGS_MODAL_ID}-body`}>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            <TooltipConfigItem />
            <StickyScrollConfigItem />
          </Flex>
        </ModalBody>
      </Modal>
      <CodeEditorControl
        icon={<CogIcon />}
        aria-label={t('Editor settings')}
        tooltipProps={{ content: t('Editor settings') }}
        onClick={() => setIsModalOpen(true)}
      />
    </>
  );
};
