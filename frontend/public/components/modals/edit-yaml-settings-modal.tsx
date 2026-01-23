import { CodeEditorControl } from '@patternfly/react-code-editor';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import {
  Flex,
  FlexItem,
  Icon,
  Modal,
  ModalBody,
  ModalHeader,
  NumberInput,
  Switch,
  SwitchProps,
} from '@patternfly/react-core';
import {
  CogIcon,
  PaintRollerIcon,
  FontIcon,
  ICursorIcon,
  MouseIcon,
} from '@patternfly/react-icons';
import { FC, ReactNode, ComponentProps, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  OVERRIDE_YAML_EDITOR_THEME_USER_SETTING_KEY,
  OVERRIDE_YAML_EDITOR_THEME_LOCAL_STORAGE_KEY,
  SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
  SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
  SHOW_YAML_EDITOR_STICKY_SCROLL_USER_SETTING_KEY,
  SHOW_YAML_EDITOR_STICKY_SCROLL_LOCAL_STORAGE_KEY,
  CUSTOM_YAML_EDITOR_FONT_SIZE_USER_SETTING_KEY,
  CUSTOM_YAML_EDITOR_FONT_SIZE_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants/common';
import { SimpleSelect, SimpleSelectOption } from '@patternfly/react-templates';

/*
 * The following is taken entirely from the PatternFly example
 *
 * https://www.patternfly.org/components/code-editor#with-configuration-modal
 */

interface ConfigModalItemProps {
  /** Icon rendered inside the configuration modal. */
  icon?: ReactNode;
  /** Description of the configuration option. */
  description: string;
  /** Title of the configuration option. We assume that titles are unique. */
  title: string;
  /**
   * Optional ID of the configuration option. Also used as a prefix for the following elements:
   * - `${id}-title` for the element which contains the title
   * - `${id}-description` for the element which contains the description
   */
  id?: string;
  /**
   * Slot to render inside the configuration modal. Remember to add `aria-labelledby` and `aria-describedby` props
   * to the control inside the slot, pointing to the title and description ids respectively.
   */
  slot?: ReactNode;
}

const ConfigModalItem: React.FunctionComponent<ConfigModalItemProps> = ({
  icon = <CogIcon />,
  description,
  title,
  id = `ConfigModalItem-${title.replace(/\s+/g, '-').toLowerCase()}`,
  slot,
}) => (
  <Flex
    alignItems={{ default: 'alignItemsCenter' }}
    justifyContent={{ default: 'justifyContentSpaceBetween' }}
    spaceItems={{ default: 'spaceItemsMd' }}
    id={id}
  >
    <FlexItem flex={{ default: 'flex_1' }}>
      <Flex spaceItems={{ default: 'spaceItemsSm' }}>
        <Icon isInline>{icon}</Icon>
        <strong id={`${id}-title`} className="pf-v6-u-font-weight-bold">
          {title}
        </strong>
      </Flex>

      <div id={`${id}-description`}>{description}</div>
    </FlexItem>
    <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>{slot}</FlexItem>
  </Flex>
);

interface ConfigModalSwitchProps extends Omit<ConfigModalItemProps, 'slot'> {
  /** Flag indicating whether the option is enabled or disabled. */
  isChecked?: SwitchProps['isChecked'];
  /** onChange handler for the switch. */
  onChange?: SwitchProps['onChange'];
  /** Labels for the enabled and disabled states of the switch. */
  labels?: {
    enabled: string;
    disabled: string;
  };
}

const ConfigModalSwitch: React.FunctionComponent<ConfigModalSwitchProps> = ({
  icon = <CogIcon />,
  description,
  title,
  id = `ConfigModalSwitch-${title.replace(/\s+/g, '-').toLowerCase()}`,
  isChecked = false,
  onChange,
  labels = { enabled: undefined, disabled: undefined },
}) => (
  <ConfigModalItem
    icon={icon}
    description={description}
    title={title}
    id={id}
    slot={
      <Switch
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        data-checked-state={isChecked}
        ouiaId={`${id}-switch`}
        isChecked={isChecked}
        isReversed
        label={isChecked ? labels.enabled : labels.disabled}
        onChange={onChange}
      />
    }
  />
);

/*
 * The following is not taken from the PatternFly example
 */
interface AppendToProps {
  appendTo?: ComponentProps<typeof Modal>['appendTo'];
}

type ThemeOption = 'default' | 'dark' | 'light';

const ThemeConfigItem: FC = () => {
  const { t } = useTranslation('public');

  const [theme, setTheme] = useUserSettingsCompatibility<ThemeOption>(
    OVERRIDE_YAML_EDITOR_THEME_USER_SETTING_KEY,
    OVERRIDE_YAML_EDITOR_THEME_LOCAL_STORAGE_KEY,
    'default',
    true,
  );

  const options: SimpleSelectOption[] = useMemo(
    () => [
      {
        value: 'default',
        description: t('Follow your user preference'),
        content: t('Use theme setting'),
        selected: theme === 'default',
      },
      {
        value: 'dark',
        description: t('Always use dark mode'),
        content: t('Dark'),
        selected: theme === 'dark',
      },
      {
        value: 'light',
        description: t('Always use light mode'),
        content: t('Light'),
        selected: theme === 'light',
      },
    ],
    [t, theme],
  );

  return (
    <ConfigModalItem
      key="color-theme"
      title={t('Theme')}
      description={t('Select the code editor color theme')}
      id="ConfigModalItem-color-theme"
      icon={<PaintRollerIcon />}
      slot={
        <SimpleSelect
          toggleProps={{
            'aria-labelledby': 'ConfigModalItem-color-theme-title',
            'aria-describedby': 'ConfigModalItem-color-theme-description',
          }}
          initialOptions={options}
          onSelect={(_e, value: ThemeOption) => setTheme(value)}
          popperProps={{ appendTo: 'inline' }}
        />
      }
    />
  );
};

const FontSizeConfigItem = () => {
  const { t } = useTranslation('public');

  const [fontSize, setFontSize] = useUserSettingsCompatibility(
    CUSTOM_YAML_EDITOR_FONT_SIZE_USER_SETTING_KEY,
    CUSTOM_YAML_EDITOR_FONT_SIZE_LOCAL_STORAGE_KEY,
    14,
    true,
  );

  return (
    <ConfigModalItem
      key="font-size"
      title={t('Font size')}
      description={t('Adjust the font size of the code editor')}
      id="ConfigModalItem-font-size"
      icon={<FontIcon />}
      slot={
        <NumberInput
          aria-labelledby="ConfigModalItem-font-size-title"
          aria-describedby="ConfigModalItem-font-size-description"
          inputAriaLabel={t('Enter a font size')}
          minusBtnAriaLabel={t('Decrease font size')}
          plusBtnAriaLabel={t('Increase font size')}
          role="group" // For screen readers to group the input and buttons as one widget
          value={fontSize}
          min={5}
          onMinus={() => setFontSize((size) => Math.max(5, size - 1))}
          onChange={(event) => setFontSize(Number((event.target as HTMLInputElement).value))}
          onPlus={() => setFontSize((size) => size + 1)}
          widthChars={2}
        />
      }
    />
  );
};

const TooltipConfigItem = () => {
  const { t } = useTranslation('public');
  const [showTooltips, setShowTooltips] = useUserSettingsCompatibility(
    SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
    SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
    true,
    true,
  );

  return (
    <ConfigModalSwitch
      title={t('Tooltips')}
      description={t('Show tooltips for Resource names, Field names, and definitions')}
      onChange={(_e, checked) => setShowTooltips(checked)}
      isChecked={showTooltips}
      icon={<ICursorIcon />}
    />
  );
};

const StickyScrollConfigItem = () => {
  const { t } = useTranslation('public');
  const [stickyScrollEnabled, setStickyScrollEnabled] = useUserSettingsCompatibility(
    SHOW_YAML_EDITOR_STICKY_SCROLL_USER_SETTING_KEY,
    SHOW_YAML_EDITOR_STICKY_SCROLL_LOCAL_STORAGE_KEY,
    true,
    true,
  );

  return (
    <ConfigModalSwitch
      title={t('Sticky scroll')}
      description={t('Pin scopes to the top of the editor so they are always visible')}
      onChange={(_e, checked) => setStickyScrollEnabled(checked)}
      isChecked={stickyScrollEnabled}
      icon={<MouseIcon />}
    />
  );
};

const EDIT_YAML_SETTINGS_MODAL_ID = 'edit-yaml-settings-modal';

/**
 * A modal which controls certain settings of the YAML editor. Based off the
 * [PatternFly code editor control] example.
 *
 * [PatternFly code editor control]: https://www.patternfly.org/components/code-editor#with-configuration-modal
 */
export const EditYamlSettingsModal: FC<AppendToProps> = ({ appendTo }) => {
  const { t } = useTranslation('public');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Modal
        aria-describedby={`${EDIT_YAML_SETTINGS_MODAL_ID}-body`}
        aria-labelledby={`${EDIT_YAML_SETTINGS_MODAL_ID}-title`}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        ouiaId={EDIT_YAML_SETTINGS_MODAL_ID}
        variant="small"
        appendTo={appendTo}
      >
        <ModalHeader
          title={t('Editor settings')}
          description={t('Changes apply immediately')}
          labelId={`${EDIT_YAML_SETTINGS_MODAL_ID}-title`}
        />
        <ModalBody id={`${EDIT_YAML_SETTINGS_MODAL_ID}-body`}>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            <ThemeConfigItem />
            <FontSizeConfigItem />
            <TooltipConfigItem />
            <StickyScrollConfigItem />
          </Flex>
        </ModalBody>
      </Modal>
      <CodeEditorControl
        aria-label={t('Editor settings')}
        aria-haspopup="dialog"
        icon={<CogIcon />}
        onClick={() => setIsModalOpen(true)}
        tooltipProps={{ content: t('Editor settings') }}
      />
    </>
  );
};

/** Get all the YAML editor settings from user settings and local storage */
export const useEditYamlSettings = () => {
  const [theme] = useUserSettingsCompatibility<ThemeOption>(
    OVERRIDE_YAML_EDITOR_THEME_USER_SETTING_KEY,
    OVERRIDE_YAML_EDITOR_THEME_LOCAL_STORAGE_KEY,
    'default',
    true,
  );
  const [fontSize] = useUserSettingsCompatibility<number>(
    CUSTOM_YAML_EDITOR_FONT_SIZE_USER_SETTING_KEY,
    CUSTOM_YAML_EDITOR_FONT_SIZE_LOCAL_STORAGE_KEY,
    14,
    true,
  );
  const [showTooltips] = useUserSettingsCompatibility<boolean>(
    SHOW_YAML_EDITOR_TOOLTIPS_USER_SETTING_KEY,
    SHOW_YAML_EDITOR_TOOLTIPS_LOCAL_STORAGE_KEY,
    true,
    true,
  );
  const [stickyScrollEnabled] = useUserSettingsCompatibility<boolean>(
    SHOW_YAML_EDITOR_STICKY_SCROLL_USER_SETTING_KEY,
    SHOW_YAML_EDITOR_STICKY_SCROLL_LOCAL_STORAGE_KEY,
    true,
    true,
  );
  return { theme, fontSize, showTooltips, stickyScrollEnabled };
};
