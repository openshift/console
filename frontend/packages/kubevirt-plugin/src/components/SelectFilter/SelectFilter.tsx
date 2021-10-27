/* eslint-disable array-callback-return, consistent-return */
import * as React from 'react';
import { Select, SelectProps, SelectVariant } from '@patternfly/react-core';

const SelectFilter: React.FC<SelectProps> = (props) => {
  const { isGrouped, children } = props;
  const options = children;

  const onFilter = (_, textInput) => {
    if (textInput === '') {
      return options;
    }

    if (isGrouped) {
      return options
        .map((option) => {
          const filteredGroup = React.cloneElement(option, {
            children: option.props.children.filter((item) => {
              return item.props.value.toLowerCase().includes(textInput.toLowerCase());
            }),
          });
          if (filteredGroup.props.children.length > 0) {
            return filteredGroup;
          }
        })
        ?.filter(Boolean);
    }

    return options?.filter((option) =>
      option.props.value.toLowerCase().includes(textInput.toLowerCase()),
    );
  };

  return (
    <Select {...props} variant={SelectVariant.single} hasInlineFilter onFilter={onFilter}>
      {options}
    </Select>
  );
};

export default SelectFilter;
