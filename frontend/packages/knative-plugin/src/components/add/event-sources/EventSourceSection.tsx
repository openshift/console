import * as React from 'react';
import { ContentVariants, Content } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import AppSection from '@console/dev-console/src/components/import/app/AppSection';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { descriptorsToUISchema } from '@console/operator-lifecycle-manager/src/components/operand/utils';
import { DynamicFormField, useFormikValidationFix } from '@console/shared';
import { formDescriptorData } from '../../../utils/create-eventsources-utils';
import { EventSources } from '../import-types';
import ApiServerSection from './ApiServerSection';
import ContainerSourceSection from './ContainerSourceSection';
import KafkaSourceSection from './KafkaSourceSection';
import PingSourceSection from './PingSourceSection';
import SinkBindingSection from './SinkBindingSection';
import SinkSection from './SinkSection';

interface EventSourceSectionProps {
  namespace: string;
  fullWidth?: boolean;
  kameletSource?: K8sResourceKind;
}

const EventSourceSection: React.FC<EventSourceSectionProps> = ({
  namespace,
  fullWidth = false,
  kameletSource,
}) => {
  const { values } = useFormikContext<FormikValues>();
  const projectResource = { kind: ProjectModel.kind, prop: ProjectModel.id, isList: true };
  const [data, loaded] = useK8sWatchResource<K8sResourceKind[]>(projectResource);
  useFormikValidationFix(values);
  const formSchema: JSONSchema7 = React.useMemo(
    () => ({
      type: 'object',
      required: kameletSource?.spec?.definition?.required,
      properties: kameletSource?.spec?.definition?.properties,
    }),
    [kameletSource],
  );

  if (!values.formData.type) {
    return null;
  }
  const defaultFormSection = (
    <>
      <SinkSection namespace={namespace} fullWidth={fullWidth} />
      <AppSection
        project={values.formData.project}
        noProjectsAvailable={loaded && _.isEmpty(data)}
        extraMargin
        subPath="formData"
        fullWidth={fullWidth}
      />
    </>
  );
  let EventSource: React.ReactElement;
  const sectionTitle = values.formData.data?.itemData?.title ?? values.formData.type;
  switch (values.formData.type) {
    case EventSources.SinkBinding:
      EventSource = <SinkBindingSection title={sectionTitle} fullWidth={fullWidth} />;
      break;
    case EventSources.ApiServerSource:
      EventSource = <ApiServerSection title={sectionTitle} fullWidth={fullWidth} />;
      break;
    case EventSources.KafkaSource:
      EventSource = (
        <KafkaSourceSection title={sectionTitle} fullWidth={fullWidth} namespace={namespace} />
      );
      break;
    case EventSources.ContainerSource:
      EventSource = <ContainerSourceSection title={sectionTitle} fullWidth={fullWidth} />;
      break;
    case EventSources.PingSource:
      EventSource = <PingSourceSection title={sectionTitle} fullWidth={fullWidth} />;
      break;
    case EventSources.KameletBinding:
      EventSource = kameletSource && (
        <>
          <Content component={ContentVariants.h2}>{kameletSource.spec?.definition?.title}</Content>
          <DynamicFormField
            name="formData.data.KameletBinding.source.properties"
            schema={formSchema}
            uiSchema={descriptorsToUISchema(formDescriptorData(formSchema.properties), formSchema)}
            showAlert={false}
          />
        </>
      );
      break;
    default:
      EventSource = null;
  }
  return (
    <>
      {EventSource}
      {defaultFormSection}
    </>
  );
};

export default EventSourceSection;
