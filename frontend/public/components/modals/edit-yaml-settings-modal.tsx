import { CodeEditorControl } from '@patternfly/react-code-editor';
import { createIcon } from '@patternfly/react-icons/dist/esm/createIcon';
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
import { CogIcon } from '@patternfly/react-icons';
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

/**!
 * Font Awesome Free 6.7.2 - https://fontawesome.com
 * License - https://fontawesome.com/license/free
 * Copyright 2025 Fonticons, Inc.
 */
const PaintRollerIcon = createIcon({
  name: 'PaintRollerIcon',
  width: 512,
  height: 512,
  svgPath:
    'M416 128V32c0-17.67-14.33-32-32-32H32C14.33 0 0 14.33 0 32v96c0 17.67 14.33 32 32 32h352c17.67 0 32-14.33 32-32zm32-64v128c0 17.67-14.33 32-32 32H256c-35.35 0-64 28.65-64 64v32c-17.67 0-32 14.33-32 32v128c0 17.67 14.33 32 32 32h64c17.67 0 32-14.33 32-32V352c0-17.67-14.33-32-32-32v-32h160c53.02 0 96-42.98 96-96v-64c0-35.35-28.65-64-64-64z',
});

/**!
 * Font Awesome Free 6.7.2 - https://fontawesome.com
 * License - https://fontawesome.com/license/free
 * Copyright 2025 Fonticons, Inc.
 */
const FontIcon = createIcon({
  name: 'FontIcon',
  width: 448,
  height: 512,
  svgPath:
    'M432 416h-23.41L277.88 53.69A32 32 0 0 0 247.58 32h-47.16a32 32 0 0 0-30.3 21.69L39.41 416H16a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16h-19.58l23.3-64h152.56l23.3 64H304a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h128a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM176.85 272L224 142.51 271.15 272z',
});
/**!
 * Font Awesome Free 6.7.2 - https://fontawesome.com
 * License - https://fontawesome.com/license/free
 * Copyright 2025 Fonticons, Inc.
 */
const ICursorIcon = createIcon({
  name: 'ICursorIcon',
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
const MouseIcon = createIcon({
  name: 'MouseIcon',
  width: 384,
  height: 512,
  svgPath:
    'M0 192l176 0L176 0 160 0C71.6 0 0 71.6 0 160l0 32zm0 32L0 352c0 88.4 71.6 160 160 160l64 0c88.4 0 160-71.6 160-160l0-128-192 0L0 224zm384-32l0-32C384 71.6 312.4 0 224 0L208 0l0 192 176 0z',
});

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
      description={t('Show tooltips for Resource names, Field names, and definitions.')}
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
      description={t('Pin scopes to the top of the editor so they are always visible.')}
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
          description={t('Changes apply immediately.')}
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
