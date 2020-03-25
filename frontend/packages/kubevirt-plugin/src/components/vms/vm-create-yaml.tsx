import * as React from 'react';
import { safeLoad } from 'js-yaml';
import { CreateYAMLProps } from '@console/internal/components/create-yaml';
import { connectToPlural } from '@console/internal/kinds';
import { k8sList } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { ErrorPage404 } from '@console/internal/components/error';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import { OSSelection } from '../../constants/vm/default-os-selection';
import { AsyncComponent, LoadingBox } from '@console/internal/components/utils';
import { VMKind } from '../../types/vm';
import { VirtualMachineModel } from '../../models';
import { resolveDefaultVM } from '../../k8s/requests/vm/create/default-vm';
import { VirtualMachineYAMLTemplates } from '../../models/templates';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { CreateVMTemplateYAML } from '../vm-templates/vm-template-create-yaml';

const VMCreateYAMLLConnected = connectToPlural(
  ({ match, kindsInFlight, kindObj, resourceObjPath }: CreateYAMLProps) => {
    const [defaultVM, setDefaultVM] = React.useState<VMKind>(null);

    React.useEffect(() => {
      k8sList(TemplateModel, {
        ns: 'openshift',
        labelSelector: {
          [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE,
          [`${TEMPLATE_FLAVOR_LABEL}/tiny`]: 'true',
          [`${TEMPLATE_WORKLOAD_LABEL}/server`]: 'true',
        },
      })
        .then(async (templates) => {
          const { osSelection, template: commonTemplate } = OSSelection.findSuitableOSAndTemplate(
            templates,
          );

          if (!commonTemplate) {
            throw new Error('no matching template');
          }

          setDefaultVM(
            await resolveDefaultVM({
              commonTemplate,
              name: 'vm-example',
              namespace: match.params.ns || 'default',
              baseOSName: osSelection.getValue(),
              containerImage: osSelection.getContainerImage(),
            }),
          );
        })
        .catch(() => {
          setDefaultVM(
            new VMWrapper(safeLoad(VirtualMachineYAMLTemplates.getIn(['default'])))
              .init()
              .setNamespace(match.params.ns || 'default')
              .asResource(),
          );
        });
    }, [match.params.ns]);

    if ((!kindObj && kindsInFlight) || !defaultVM) {
      return <LoadingBox />;
    }
    if (!kindObj) {
      return <ErrorPage404 />;
    }

    const DroppableEditYAML = () =>
      import('@console/internal/components/droppable-edit-yaml').then((c) => c.DroppableEditYAML);

    return (
      <AsyncComponent
        loader={DroppableEditYAML}
        obj={defaultVM}
        create
        kind={kindObj.kind}
        resourceObjPath={resourceObjPath}
        header={`Create ${kindObj.label}`}
      />
    );
  },
);

export const VMCreateYAML = (props: any) => {
  const search = props.location?.search;
  const userMode = new URLSearchParams(search).get('mode');

  return userMode === 'template' ? (
    <CreateVMTemplateYAML {...props} />
  ) : (
    <VMCreateYAMLLConnected
      {...(props as any)}
      kindObj={VirtualMachineModel.kind}
      plural={VirtualMachineModel.plural}
    />
  );
};
