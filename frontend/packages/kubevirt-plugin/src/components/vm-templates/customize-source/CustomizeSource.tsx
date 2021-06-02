import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { StatusBox } from '@console/internal/components/utils';
import { TEMPLATE_CUSTOMIZED_ANNOTATION } from '../../../constants';
import { useCustomizeVMTResources } from '../../../hooks/use-customize-vmt-resources';
import { isVMIRunning } from '../../../selectors/vmi';
import { getVMStatus } from '../../../statuses/vm/vm-status';
import CustomizeSourceConsole from './CustomizeSourceConsole';
import CustomizeSourceFinish from './CustomizeSourceFinish';
import CustomizeSourceStatus from './CustomizeSourceStatus';

const CustomizeSource: React.FC<RouteComponentProps> = ({ location }) => {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(location.search);
  const name = urlParams.get('vm');
  const namespace = urlParams.get('vmNs');
  const { vm, vmi, pods, dataVolumes, pvcs, loaded, loadError } = useCustomizeVMTResources(
    name,
    namespace,
  );

  const [finish, setFinish] = React.useState(false);

  if (!name || !namespace) {
    return (
      <Alert title={t('kubevirt-plugin~Incorrect parameters')} variant="danger">
        {t('kubevirt-plugin~You have provided incorrect parameters')}
      </Alert>
    );
  }

  if (loaded) {
    try {
      JSON.parse(vm.metadata.annotations[TEMPLATE_CUSTOMIZED_ANNOTATION]);
    } catch {
      return (
        <Alert title={t('kubevirt-plugin~Incorrect virtual machine')} variant="danger">
          {t('kubevirt-plugin~This VM is not a temporary VM for template customization.')}
        </Alert>
      );
    }
  }

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    pvcs,
    dataVolumes,
  });

  return finish ? (
    <CustomizeSourceFinish vm={vm} />
  ) : (
    <StatusBox loaded={loaded} loadError={loadError} data={vm}>
      {isVMIRunning(vmi) ? (
        <CustomizeSourceConsole
          vm={vm}
          vmi={vmi}
          vmStatusBundle={vmStatusBundle}
          setFinish={setFinish}
        />
      ) : (
        <CustomizeSourceStatus vm={vm} vmi={vmi} vmStatusBundle={vmStatusBundle} />
      )}
    </StatusBox>
  );
};

export default CustomizeSource;
