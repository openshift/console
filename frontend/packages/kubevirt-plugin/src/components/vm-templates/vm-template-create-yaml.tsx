/* eslint-disable lines-between-class-members */
import * as React from 'react';
import { safeLoad } from 'js-yaml';
import { TemplateModel } from '@console/internal/models';
import { connectToPlural } from '@console/internal/kinds';
import { CreateYAMLProps } from '@console/internal/components/create-yaml';
import { k8sList, K8sResourceKind, TemplateKind } from '@console/internal/module/k8s';
import {
  LoadingBox,
  AsyncComponent,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { ErrorPage404 } from '@console/internal/components/error';
import { getNamespace, getName } from '@console/shared';
import { VMTemplateYAMLTemplates } from '../../models/templates';
import { VM_TEMPLATE_CREATE_HEADER } from '../../constants/vm-templates';
import { resolveDefaultVMTemplate } from '../../k8s/requests/vm/create/default-template';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import { VMTemplateWrapper } from '../../k8s/wrapper/vm/vm-template-wrapper';
import { OSSelection } from '../../constants/vm/default-os-selection';

const CreateVMTemplateYAMLConnected = connectToPlural(
  ({ match, kindsInFlight, kindObj }: CreateYAMLProps) => {
    const [defaultTemplate, setDefaultTemplate] = React.useState<TemplateKind>(null);

    React.useEffect(() => {
      k8sList(TemplateModel, {
        ns: 'openshift',
        labelSelector: {
          [TEMPLATE_TYPE_LABEL]: TEMPLATE_TYPE_BASE,
          [`${TEMPLATE_FLAVOR_LABEL}/tiny`]: 'true',
          [`${TEMPLATE_WORKLOAD_LABEL}/server`]: 'true',
        },
      })
        .then((templates) => {
          const { osSelection, template: commonTemplate } = OSSelection.findSuitableOSAndTemplate(
            templates,
          );

          if (!commonTemplate) {
            throw new Error('no matching template');
          }

          setDefaultTemplate(
            resolveDefaultVMTemplate({
              commonTemplate,
              name: 'vm-template-example',
              namespace: match.params.ns || 'default',
              baseOSName: osSelection.getValue(),
              containerImage: osSelection.getContainerImage(),
            }),
          );
        })
        .catch(() => {
          setDefaultTemplate(
            new VMTemplateWrapper(safeLoad(VMTemplateYAMLTemplates.getIn(['vm-template'])))
              .init()
              .setNamespace(match.params.ns || 'default')
              .asResource(),
          );
        });
    }, [match.params.ns]);

    if ((!kindObj && kindsInFlight) || !defaultTemplate) {
      return <LoadingBox />;
    }
    if (!kindObj) {
      return <ErrorPage404 />;
    }

    const vmTemplateObjPath = (o: K8sResourceKind) =>
      resourcePathFromModel(
        { ...TemplateModel, plural: 'vmtemplates' },
        getName(o),
        getNamespace(o),
      );
    const DroppableEditYAML = () =>
      import('@console/internal/components/droppable-edit-yaml').then((c) => c.DroppableEditYAML);

    return (
      <AsyncComponent
        loader={DroppableEditYAML}
        obj={defaultTemplate}
        create
        kind={kindObj.kind}
        resourceObjPath={vmTemplateObjPath}
        header={VM_TEMPLATE_CREATE_HEADER}
      />
    );
  },
);

export const CreateVMTemplateYAML = (props: any) => (
  <CreateVMTemplateYAMLConnected {...(props as any)} plural={TemplateModel.plural} />
);
