import * as React from 'react';
import { EventingKafkaChannelModel } from '../../../../models';
import KafkaChannelSection from './KafkaChannelSection';
import DefaultChannelSection from './DefaultChannelSection';

type FormViewSectionProps = {
  namespace: string;
  kind: string;
};

const getChannelSection = (kind: string): React.ReactElement | null => {
  if (kind === EventingKafkaChannelModel.kind) {
    return <KafkaChannelSection />;
  }
  return null;
};

const FormViewSection: React.FC<FormViewSectionProps> = ({ namespace, kind }) => (
  <>
    {getChannelSection(kind)}
    <DefaultChannelSection namespace={namespace} />
  </>
);

export default FormViewSection;
