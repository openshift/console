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
  const [textInputLabelValue, setTextInputLabelValue] = React.useState('');

  const toolbarSelectOptions = [
    <SelectOption key={0} value="Name" />,
    <SelectOption key={1} value="Label" />,
  ];

  const onToggleToolbarSelect = (isOpen) => {
    setIsToolbarSelectOpen(isOpen);
  };

  const onSelect = selection => {
    setToolbarSelections(selection);
    setIsToolbarSelectOpen(!isToolbarSelectOpen);
  };

  const handleTextInputNameChange = value => {
    setTextInputNameValue(value);
  };

  const handleTextInputLabelChange = value => {
    setTextInputLabelValue(value);
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
              {toolbarSelectOptions}
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
            {toolbarSelections === 'Label' && (
              <TextInput
                value={textInputLabelValue}
                type="text"
                onChange={handleTextInputLabelChange}
                aria-label="Search by label"
                placeholder="Search by label..."
              />
            )}
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default StreamsInstanceFilter;
