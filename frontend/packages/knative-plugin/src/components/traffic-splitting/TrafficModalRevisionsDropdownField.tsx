import * as React from 'react';
import { useField } from 'formik';
import { DropdownField } from '@console/shared';
import { RevisionItems } from '../../utils/traffic-splitting-utils';

type TrafficModalRevisionsDropdownFieldProps = {
  revisionItems: RevisionItems;
  name: string;
  title: string;
};

const TrafficModalRevisionsDropdownField: React.FC<TrafficModalRevisionsDropdownFieldProps> = ({
  revisionItems,
  name,
  title,
}) => {
  const [field] = useField(name);
  const dropdownItems =
    !field.value || Object.values(revisionItems).includes(field.value)
      ? revisionItems
      : { ...revisionItems, [field.value]: field.value };
  return (
    <DropdownField
      name={name}
      items={dropdownItems}
      title={field.value || title}
      fullWidth
      required
    />
  );
};

export default TrafficModalRevisionsDropdownField;
