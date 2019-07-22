import * as React from 'react';
import { safeLoad } from 'js-yaml';
import { TemplateModel } from '@console/internal/models';
import { connectToPlural } from '@console/internal/kinds';
import { CreateYAMLProps } from '@console/internal/components/create-yaml';
import {
  LoadingBox,
  AsyncComponent,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { ErrorPage404 } from '@console/internal/components/error';
import { getNamespace, getName } from '@console/shared';
import { VMTemplateYAMLTemplates } from '../../models/templates';
import { VM_TEMPLATE_CREATE_HEADER } from '../../constants/vm-templates';
import { K8sResourceKind } from '../../../../../public/module/k8s/index';

const CreateVMTemplateYAMLConnected = connectToPlural(
  ({ match, kindsInFlight, kindObj }: CreateYAMLProps) => {
    if (!kindObj) {
      if (kindsInFlight) {
        return <LoadingBox />;
      }
      return <ErrorPage404 />;
    }

    const template = VMTemplateYAMLTemplates.getIn(['vm-template']);
    const obj = safeLoad(template);
    obj.kind = kindObj.kind;
    obj.metadata = obj.metadata || {};
    obj.metadata.namespace = match.params.ns || 'default';

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
        obj={obj}
        create
        kind={kindObj.kind}
        resourceObjPath={vmTemplateObjPath}
        header={VM_TEMPLATE_CREATE_HEADER}
      />
    );
  },
);

export const CreateVMTemplateYAML = (props: any) => (
  <CreateVMTemplateYAMLConnected {...props as any} plural={TemplateModel.plural} />
);
