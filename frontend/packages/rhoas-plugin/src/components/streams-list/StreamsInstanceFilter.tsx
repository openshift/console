import * as React from 'react';
import {
  Select,
  SelectVariant,
  SelectOption,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  ToolbarGroup,
} from '@patternfly/react-core';

const StreamsInstanceFilter = () => {
  const [isToolbarSelectOpen, setIsToolbarSelectOpen] = React.useState(false);
  const [toolbarSelections, setToolbarSelections] = React.useState("Name");
  const [textInputNameValue, setTextInputNameValue] = React.useState('');

  const onToggleToolbarSelect = (isOpen) => {
    setIsToolbarSelectOpen(isOpen);
  };

  const onSelect = (selection) => {
    setToolbarSelections(selection);
    setIsToolbarSelectOpen(false);
  };

  const handleTextInputNameChange = value => {
    setTextInputNameValue(value);
  };

  return (
    <Toolbar id="toolbar-filter-instances">
      <ToolbarContent>
        <ToolbarGroup variant="filter-group">
          <ToolbarItem>
            <Select
              variant={SelectVariant.single}
              aria-label="Select name"
              onToggle={onToggleToolbarSelect}
              onSelect={onSelect}
              selections={toolbarSelections}
              isOpen={isToolbarSelectOpen}
              aria-labelledby=""
            >
              <SelectOption key={0} value="Name" />
            </Select>
          </ToolbarItem>
          <ToolbarItem>
            {toolbarSelections === 'Name' && (
              <TextInput
                value={textInputNameValue}
                type="text"
                onChange={handleTextInputNameChange}
                aria-label="Search by name"
                placeholder="Search by name..."
              />
            )}
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default StreamsInstanceFilter;
