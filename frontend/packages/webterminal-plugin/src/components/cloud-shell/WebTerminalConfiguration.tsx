import * as React from 'react';
import {
  Button,
  Checkbox,
  FormGroup,
  FormHelperText,
  FormSection,
  TextInput,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import { NumberSpinner } from '@console/internal/components/utils/number-spinner';
import { referenceForModel } from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared';
import {
  LoadError,
  SaveStatus,
  SaveStatusProps,
} from '@console/shared/src/components/cluster-configuration';
import { DevWorkspaceTemplateModel } from '../../../models';
import { DEFAULT_NS_OPERATORS } from '../../const';
import { updatedWebTerminalExec, updatedWebTerminalTooling } from '../../utils/customization-utils';
import { CloudShellResource } from './cloud-shell-utils';
import { getCloudShellTimeout } from './setup/cloud-shell-setup-utils';
import useCloudShellNamespace from './useCloudShellNamespace';

const WebTerminalConfiguration: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [operatorNamespace] = useCloudShellNamespace();
  const [unit, setUnit] = React.useState<string>('m');
  const [value, setValue] = React.useState<number>(0);
  const [image, setImage] = React.useState('');
  const [timeoutCheckBox, setTimeoutCheckBox] = React.useState(false);
  const [imageCheckBox, setImageCheckBox] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatusProps>();

  const webTerminalExecResource: WatchK8sResource = React.useMemo(() => {
    return {
      kind: referenceForModel(DevWorkspaceTemplateModel),
      namespaced: true,
      isList: false,
      name: 'web-terminal-exec',
      namespace: operatorNamespace || DEFAULT_NS_OPERATORS,
    };
  }, [operatorNamespace]);

  const webTerminalToolingResource: WatchK8sResource = React.useMemo(() => {
    return {
      kind: referenceForModel(DevWorkspaceTemplateModel),
      namespaced: true,
      isList: false,
      name: 'web-terminal-tooling',
      namespace: operatorNamespace || DEFAULT_NS_OPERATORS,
    };
  }, [operatorNamespace]);

  const [webTerminalExec, isLoaded, loadError] = useK8sWatchResource<CloudShellResource>(
    webTerminalExecResource,
  );

  const [
    webTerminalTooling,
    iswebTerminalToolingLoaded,
    webTerminalToolingloadError,
  ] = useK8sWatchResource<CloudShellResource>(webTerminalToolingResource);

  const terminalExecResource =
    webTerminalExec &&
    isLoaded &&
    !loadError &&
    webTerminalExec?.spec?.components?.find((e) => e.name === 'web-terminal-exec');

  const terminalToolingResource =
    webTerminalTooling &&
    iswebTerminalToolingLoaded &&
    !webTerminalToolingloadError &&
    webTerminalTooling?.spec?.components?.find((e) => e.name === 'web-terminal-tooling');
  React.useEffect(() => {
    if (isLoaded && !loadError && terminalExecResource) {
      const terminalExecComponent = terminalExecResource?.container?.env?.find(
        (e) => e.name === 'WEB_TERMINAL_IDLE_TIMEOUT',
      );
      if (terminalExecComponent?.value) {
        const initialUnit = terminalExecComponent.value.match(/[a-z]+/gi).join('');
        const initialTimeOutValue = terminalExecComponent.value.match(/\d+/g).join('');
        setUnit(initialUnit);
        setValue(parseInt(initialTimeOutValue, 10));
      }
      if (webTerminalExec?.metadata?.annotations) {
        setTimeoutCheckBox(
          webTerminalExec.metadata.annotations['web-terminal.redhat.com/unmanaged-state'] ===
            'true',
        );
      }
    }
  }, [webTerminalExec, isLoaded, loadError, terminalExecResource]);

  React.useEffect(() => {
    if (iswebTerminalToolingLoaded && !webTerminalToolingloadError && terminalToolingResource) {
      if (terminalToolingResource?.container?.image) {
        setImage(terminalToolingResource.container.image);
      }
      if (webTerminalTooling?.metadata?.annotations) {
        setImageCheckBox(
          webTerminalTooling.metadata.annotations['web-terminal.redhat.com/unmanaged-state'] ===
            'true',
        );
      }
    }
  }, [
    webTerminalTooling,
    iswebTerminalToolingLoaded,
    webTerminalToolingloadError,
    terminalToolingResource,
  ]);

  const TimeoutUnits = {
    s: t('webterminal-plugin~Seconds'),
    m: t('webterminal-plugin~Minutes'),
    h: t('webterminal-plugin~Hours'),
    ms: t('webterminal-plugin~Milliseconds'),
  };

  const onValueChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setSaveStatus({ status: null });
    setValue(parseInt(event.currentTarget.value, 10));
  };

  const onImageChange = (newValue: string) => {
    setSaveStatus({ status: null });
    setImage(newValue);
  };

  const onUnitChange = (newUnit: string) => {
    setSaveStatus({ status: null });
    setUnit(newUnit);
  };

  const changeValueBy = (changeBy: number) => {
    // When default defaultRequestSizeValue is not set, value becomes NaN and increment decrement buttons of NumberSpinner don't work.
    const newValue = Number.isFinite(value) ? value + changeBy : 0 + changeBy;
    setValue(newValue);
    setSaveStatus({ status: null });
  };

  const submit = async () => {
    setSaveStatus({ status: 'pending' });

    const csTimeout = getCloudShellTimeout(value, unit) || '';
    const newWebTerminalExec = updatedWebTerminalExec(
      webTerminalExec,
      timeoutCheckBox,
      terminalExecResource,
      csTimeout,
    );
    const newWebTerminalTooling = updatedWebTerminalTooling(
      webTerminalTooling,
      imageCheckBox,
      terminalToolingResource,
      image,
    );
    try {
      k8sUpdateResource({
        model: DevWorkspaceTemplateModel,
        data: newWebTerminalExec,
        name: 'web-terminal-exec',
        ns: operatorNamespace || DEFAULT_NS_OPERATORS,
      });
      k8sUpdateResource({
        model: DevWorkspaceTemplateModel,
        data: newWebTerminalTooling,
        name: 'web-terminal-tooling',
        ns: operatorNamespace || DEFAULT_NS_OPERATORS,
      });
      fireTelemetryEvent('Console cluster configuration changed', {
        customize: 'Web Terminal configuration items',
        timeout: csTimeout,
        image,
      });
      setSaveStatus({ status: 'successful' });
    } catch (e) {
      setSaveStatus({ status: 'error', error: e });
    }
  };
  return (
    <FormSection
      title={t('webterminal-plugin~Web Terminal Configuration')}
      data-test="web-terminal form-section"
    >
      <FormHelperText isHidden={false}>
        {t(
          'webterminal-plugin~As admin you can change the default timeout and image of Web Terminal.',
        )}
      </FormHelperText>
      <FormGroup
        label={t('webterminal-plugin~Timeout')}
        helperText={t('webterminal-plugin~Set timeout for the terminal.')}
        fieldId="timeout-value"
      >
        <div className="pf-c-input-group">
          <NumberSpinner
            onChange={onValueChange}
            changeValueBy={changeValueBy}
            name="timeout-value"
            id="timeout-value"
            data-test="timeout-value"
            value={value}
            min={0}
            disabled={readonly}
          />
          <Dropdown
            title={TimeoutUnits[unit]}
            selectedKey={unit}
            name="timeout-unit"
            className="request-size-input__unit"
            items={TimeoutUnits}
            onChange={onUnitChange}
            ariaLabel={t('webterminal-plugin~Number of {{sizeUnit}}', {
              sizeUnit: TimeoutUnits[unit],
            })}
            disabled={readonly}
          />
        </div>
      </FormGroup>
      <FormGroup>
        <Checkbox
          id="timeout-value-checkbox"
          data-test="timeout-value-checkbox"
          isChecked={timeoutCheckBox}
          key="timeout-value-checkbox"
          onChange={() => setTimeoutCheckBox(!timeoutCheckBox)}
          label={t(
            'webterminal-plugin~Mark the configuration resource as "Unmanaged" to keep the default timeout even after operator restart or update.',
          )}
          isDisabled={readonly}
        />
      </FormGroup>

      <FormGroup
        label={t('webterminal-plugin~Image')}
        helperText={t('webterminal-plugin~Set custom image for the terminal.')}
        fieldId="web-terminal-image"
      >
        <TextInput
          value={image}
          onChange={onImageChange}
          name="web-terminal-image"
          id="web-terminal-image"
          type="text"
          aria-label="web-terminal-image"
          className="pf-c-form-control"
          data-test="web-terminal-image"
          isDisabled={readonly}
        />
      </FormGroup>
      <FormGroup>
        <Checkbox
          id="image-value-checkbox"
          data-test="image-value-checkbox"
          isChecked={imageCheckBox}
          key="image-value-checkbox"
          onChange={() => setImageCheckBox(!imageCheckBox)}
          label={t(
            'webterminal-plugin~Mark the configuration resource as "Unmanaged" to keep the default image even after operator restart or update.',
          )}
          isDisabled={readonly}
        />
      </FormGroup>
      <FormGroup>
        <Button
          variant="primary"
          onClick={submit}
          data-test="save-button"
          isDisabled={readonly || loadError || webTerminalToolingloadError}
        >
          {t('webterminal-plugin~Save')}
        </Button>
      </FormGroup>
      <LoadError error={loadError || webTerminalToolingloadError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default WebTerminalConfiguration;
