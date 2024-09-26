/* eslint-disable array-callback-return, consistent-return */
import * as React from 'react';
import {
  Select as SelectDeprecated,
  SelectProps as SelectPropsDeprecated,
  SelectVariant as SelectVariantDeprecated,
} from '@patternfly/react-core/deprecated';

const FilteredSelect: React.FC<SelectPropsDeprecated> = (props) => {
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
    <SelectDeprecated
      {...props}
      variant={SelectVariantDeprecated.single}
      hasInlineFilter
      onFilter={onFilter}
    >
      {options}
    </SelectDeprecated>
  );
};

export default FilteredSelect;
