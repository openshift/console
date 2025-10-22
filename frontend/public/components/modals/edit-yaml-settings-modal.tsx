import { CodeEditorControl } from '@patternfly/react-code-editor';
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
import { ICursorIcon, MouseIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
  SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
  SHOW_YAML_EDITOR_STICKY_SCROLL_USER_SETTING_KEY,
  SHOW_YAML_EDITOR_STICKY_SCROLL_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants/common';

interface ConfigModalItemProps {
  title: string;
  description: string;
  checked?: boolean;
  setChecked: (checked: boolean) => void;
  Icon: React.ComponentType;
}

const ConfigModalItem: React.FCC<ConfigModalItemProps> = ({
  title,
  description,
  checked,
  setChecked,
  Icon,
}) => {
  const { t } = useTranslation('public');

  return (
    <Split hasGutter>
      <SplitItem isFilled>
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Icon />
          </FlexItem>
          <FlexItem>
            <strong className="pf-v6-u-font-weight-bold">{title}</strong>
            <Content component="p">{description}</Content>
          </FlexItem>
        </Flex>
      </SplitItem>
      <SplitItem>
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
      Icon={ICursorIcon}
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
      Icon={MouseIcon}
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
        icon={undefined}
        isSettings
        aria-label={t('Editor settings')}
        tooltipProps={{ content: t('Editor settings') }}
        onClick={() => setIsModalOpen(true)}
      />
    </>
  );
};
