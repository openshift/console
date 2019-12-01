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
import { k8sGet } from '@console/internal/module/k8s';
import { VMTemplateYAMLTemplates } from '../../models/templates';
import { VM_TEMPLATE_CREATE_HEADER } from '../../constants/vm-templates';
import { LABEL_USED_TEMPLATE_NAME, LABEL_TEMPLATE_REVISION } from '../../constants/vm';
import { K8sResourceKind } from '../../../../../public/module/k8s/index';

const CreateVMTemplateYAMLConnected = connectToPlural(
  ({ match, kindsInFlight, kindObj }: CreateYAMLProps) => {
    if (!kindObj) {
      if (kindsInFlight) {
        return <LoadingBox />;
      }
      return <ErrorPage404 />;
    }
    const [obj, setObj] = React.useState({});
    const template = VMTemplateYAMLTemplates.getIn(['vm-template']);
    const sampleObj = safeLoad(template);
    sampleObj.kind = kindObj.kind;
    sampleObj.metadata = sampleObj.metadata || {};
    sampleObj.metadata.namespace = match.params.ns || 'default';

    if (Object.keys(obj).length === 0) {
      setObj(Object.assign(obj, sampleObj));
    }

    React.useEffect(() => {
      k8sGet(TemplateModel, '', 'openshift')
        .then((templates) => {
          return templates.items.find(
            (item) =>
              item.metadata.labels['flavor.template.kubevirt.io/small'] &&
              item.metadata.labels['workload.template.kubevirt.io/server'] &&
              item.metadata.name.includes('fedora'),
          );
        })
        .then((res) => {
          sampleObj.objects[0].metadata.labels[LABEL_USED_TEMPLATE_NAME] =
            res.objects[0].metadata.labels[LABEL_USED_TEMPLATE_NAME];
          sampleObj.objects[0].metadata.labels[LABEL_TEMPLATE_REVISION] =
            res.objects[0].metadata.labels[LABEL_TEMPLATE_REVISION];
          setObj(Object.assign(obj, sampleObj));
        })
        // eslint-disable-next-line no-console
        .catch((err) => console.warn('Error fetching common templates:', err));
    }, [sampleObj, obj]);
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
  <CreateVMTemplateYAMLConnected {...(props as any)} plural={TemplateModel.plural} />
);
