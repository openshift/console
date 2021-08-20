import * as React from 'react';
import { Form } from '@patternfly/react-core';
import { ResolvedUserPreferenceItem } from './types';
import UserPreferenceField from './UserPreferenceField';

type UserPreferenceFormProps = { items: ResolvedUserPreferenceItem[] };

const UserPreferenceForm: React.FC<UserPreferenceFormProps> = ({ items }) =>
  items?.length > 0 ? (
    <Form onSubmit={(event) => event.preventDefault()} className="co-user-preference__form">
      {items.map((item) => (
        <UserPreferenceField key={item.id} item={item} />
      ))}
    </Form>
  ) : null;
export default UserPreferenceForm;
