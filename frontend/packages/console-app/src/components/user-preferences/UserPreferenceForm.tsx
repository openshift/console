import type { FC } from 'react';
import { Form } from '@patternfly/react-core';
import type { ResolvedUserPreferenceItem } from './types';
import UserPreferenceField from './UserPreferenceField';

import './UserPreferenceForm.scss';

type UserPreferenceFormProps = { items: ResolvedUserPreferenceItem[] };

const UserPreferenceForm: FC<UserPreferenceFormProps> = ({ items }) =>
  items && items.length > 0 ? (
    <Form
      onSubmit={(event) => event.preventDefault()}
      className="co-user-preference__form"
      role="form"
    >
      {items.map((item) => (
        <UserPreferenceField key={item.id} item={item} />
      ))}
    </Form>
  ) : null;
export default UserPreferenceForm;
