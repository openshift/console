import * as React from 'react';
import { Button, Flex, FlexItem, Label, Popover, Switch } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { useTranslation } from 'react-i18next';
import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import { useFlag, useUserSettings } from '@console/shared';
import { OLMV1_ENABLED_USER_SETTING_KEY } from '../const';

/**
 * Toolbar component for toggling OLMv1 UI visibility in the operator catalog.
 * Uses user settings to persist the toggle state.
 */
const OLMv1ToolbarToggle: React.FC = () => {
  const { t } = useTranslation();
  const techPreviewEnabled = useFlag(FLAG_TECH_PREVIEW);
  const [olmv1Enabled, setOlmv1Enabled] = useUserSettings<boolean>(
    OLMV1_ENABLED_USER_SETTING_KEY,
    techPreviewEnabled ?? false,
    true,
  );

  const handleToggle = React.useCallback(
    (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
      setOlmv1Enabled(checked);
    },
    [setOlmv1Enabled],
  );

  const popoverContent = (
    <div>
      {t(
        'olm-v1~Lets you use OLMv1 (Tech Preview), a streamlined redesign of OLMv0. OLMv1 simplifies operator management with declarative APIs, enhanced security, and direct, GitOps-friendly control over upgrades.',
      )}
    </div>
  );

  return (
    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
      <FlexItem>
        <Switch
          id="olmv1-toggle"
          label={t('olm-v1~Enable OLMv1')}
          isChecked={olmv1Enabled ?? false}
          onChange={handleToggle}
          aria-label={t('olm-v1~Toggle OLMv1 UI')}
        />
      </FlexItem>
      <FlexItem>
        <Label color="yellow" isCompact>
          {t('olm-v1~Tech Preview')}
        </Label>
      </FlexItem>
      <FlexItem>
        <Popover aria-label={t('olm-v1~OLMv1 information')} bodyContent={popoverContent}>
          <Button
            icon={<OutlinedQuestionCircleIcon />}
            aria-label={t('olm-v1~OLMv1 information')}
            variant="link"
            isInline
          />
        </Popover>
      </FlexItem>
    </Flex>
  );
};

export default OLMv1ToolbarToggle;
