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
import { DevWorkspaceTemplateModel } from '@console/internal/models';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared';
import {
  LoadError,
  SaveStatus,
  SaveStatusProps,
} from '@console/shared/src/components/cluster-configuration';
import { DEFAULT_NS_OPERATORS } from '../../consts';
import { getCloudShellTimeout } from './setup/cloud-shell-setup-utils';
import useCloudShellNamespace from './useCloudShellNamespace';

const WebTerminalConfiguration = ({ readonly }) => {
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

  const [webTerminalExec, isLoaded, loadError] = useK8sWatchResource<K8sResourceKind>(
    webTerminalExecResource,
  );

  const [
    webTerminalTooling,
    iswebTerminalToolingLoaded,
    webTerminalToolingloadError,
  ] = useK8sWatchResource<K8sResourceKind>(webTerminalToolingResource);

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
        setTimeoutCheckBox(
          webTerminalExec.metadata.annotations['web-terminal.redhat.com/unmanaged-state'] ===
            'true',
        );
      }
    }
  }, [webTerminalExec, isLoaded, loadError, terminalExecResource]);

  React.useEffect(() => {
    if (
      iswebTerminalToolingLoaded &&
      !webTerminalToolingloadError &&
      terminalToolingResource &&
      terminalToolingResource?.container?.image
    ) {
      setImage(terminalToolingResource.container.image);
      setImageCheckBox(
        webTerminalTooling.metadata.annotations['web-terminal.redhat.com/unmanaged-state'] ===
          'true',
      );
    }
  }, [
    webTerminalTooling,
    iswebTerminalToolingLoaded,
    webTerminalToolingloadError,
    terminalToolingResource,
  ]);

  const TimeoutUnits = {
    s: t('console-app~Seconds'),
    m: t('console-app~Minutes'),
    h: t('console-app~Hours'),
    ms: t('console-app~Milliseconds'),
  };

  const onValueChange: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setSaveStatus({ status: null });
    setValue(parseInt(event.currentTarget.value, 10));
  };

  const onImageChange = (event) => {
    setSaveStatus({ status: null });
    setImage(event);
  };

  const onUnitChange = (newUnit) => {
    setSaveStatus({ status: null });
    setUnit(newUnit);
  };

  const changeValueBy = (changeBy: number) => {
    // When default defaultRequestSizeValue is not set, value becomes NaN and increment decrement buttons of NumberSpinner don't work.
    const newValue = Number.isFinite(value) ? value + changeBy : 0 + changeBy;
    setValue(newValue);
    setSaveStatus({ status: null });
  };

  const getUpdatedComponentImage = (oldComponent, newImage) => {
    if (!oldComponent) {
      return [
        {
          name: 'web-terminal-tooling',
          container: {
            image: newImage,
          },
        },
      ];
    }
    if (terminalToolingResource) {
      terminalToolingResource.container.image = newImage;
      return oldComponent;
    }
    return [
      ...oldComponent,
      {
        name: 'web-terminal-tooling',
        container: {
          image: newImage,
        },
      },
    ];
  };

  const getUpdatedComponentTimeout = (oldComponent, timeout) => {
    if (!oldComponent) {
      return [
        {
          name: 'web-terminal-exec',
          container: {
            env: [{ name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout }],
            image: '',
          },
        },
      ];
    }
    const terminalExecComponent = terminalExecResource?.container?.env?.find(
      (e) => e.name === 'WEB_TERMINAL_IDLE_TIMEOUT',
    );
    if (terminalExecResource && !terminalExecComponent?.value) {
      let newEnvVariables;
      if (terminalExecResource?.container?.env) {
        newEnvVariables = [
          ...terminalExecResource.container.env,
          { name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout },
        ];
      } else {
        newEnvVariables = [{ name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout }];
      }
      terminalExecResource.container = {
        ...terminalExecResource.container,
        env: newEnvVariables,
      };
      return oldComponent;
    }
    if (terminalExecResource && terminalExecComponent?.value) {
      terminalExecComponent.value = timeout;
      return oldComponent;
    }
    return [
      ...oldComponent,
      {
        name: 'web-terminal-exec',
        container: {
          env: [{ name: 'WEB_TERMINAL_IDLE_TIMEOUT', value: timeout }],
          image: '',
        },
      },
    ];
  };

  const submit = async () => {
    setSaveStatus({ status: 'pending' });

    const csTimeout = getCloudShellTimeout(value, unit) || '';
    const newWebTerminalExec = {
      ...webTerminalExec,
      metadata: {
        ...webTerminalExec?.metadata,
        annotations: {
          ...webTerminalExec?.metadata?.annotations,
          'web-terminal.redhat.com/unmanaged-state': timeoutCheckBox ? 'true' : 'false',
        },
      },
      spec: {
        ...webTerminalExec?.spec,
        components: getUpdatedComponentTimeout(webTerminalExec?.spec?.components, csTimeout),
      },
    };

    const newWebTerminalTooling = {
      ...webTerminalTooling,
      metadata: {
        ...webTerminalTooling?.metadata,
        annotations: {
          ...webTerminalTooling?.metadata?.annotations,
          'web-terminal.redhat.com/unmanaged-state': imageCheckBox ? 'true' : 'false',
        },
      },
      spec: {
        ...webTerminalTooling?.spec,
        components: getUpdatedComponentImage(webTerminalTooling?.spec?.components, image),
      },
    };
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
      title={t('console-app~Web Terminal Configuration')}
      data-test="web-terminal form-section"
    >
      <FormHelperText isHidden={false}>
        {t('console-app~As admin you can change the default timeout and image of Web Terminal.')}
      </FormHelperText>
      <FormGroup
        label={t('console-app~Timeout')}
        helperText={t('console-app~Set timeout for the terminal.')}
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
          />
          <Dropdown
            title={TimeoutUnits[unit]}
            selectedKey={unit}
            name="timeout-unit"
            className="request-size-input__unit"
            items={TimeoutUnits}
            onChange={onUnitChange}
            ariaLabel={t('console-app~Number of {{sizeUnit}}', {
              sizeUnit: TimeoutUnits[unit],
            })}
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
            'console-app~Mark the configuration resource as "Unmanaged" to keep the default timeout even after operator restart or update.',
          )}
        />
      </FormGroup>

      <FormGroup
        label={t('console-app~Image')}
        helperText={t('console-app~Set custom image for the terminal.')}
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
            'console-app~Mark the configuration resource as "Unmanaged" to keep the default image even after operator restart or update.',
          )}
        />
      </FormGroup>
      <FormGroup>
        <Button
          variant="primary"
          onClick={submit}
          data-test="save-button"
          isDisabled={readonly || loadError || webTerminalToolingloadError}
        >
          {t('console-app~Save')}
        </Button>
      </FormGroup>
      <LoadError error={loadError || webTerminalToolingloadError} />
      <SaveStatus {...saveStatus} />
    </FormSection>
  );
};

export default WebTerminalConfiguration;
