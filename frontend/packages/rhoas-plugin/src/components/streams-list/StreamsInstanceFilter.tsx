import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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

  const selectOptions = [
    <SelectOption key={0} value="Name" />
  ]

  return (
    <Toolbar id="toolbar-filter-instances">
      <ToolbarContent>
        <ToolbarGroup variant="filter-group">
          <ToolbarItem>
            <Select
              variant={SelectVariant.single}
              aria-label={t('rhoas-plugin~Select name')}
              onToggle={onToggleToolbarSelect}
              onSelect={onSelect}
              selections={toolbarSelections}
              isOpen={isToolbarSelectOpen}
              aria-labelledby=""
            >
              {selectOptions}
            </Select>
          </ToolbarItem>
          <ToolbarItem>
            {toolbarSelections === 'Name' && (
              <TextInput
                value={textInputNameValue}
                type="text"
                onChange={handleTextInputNameChange}
                aria-label={t('rhoas-plugin~Search by name')}
                placeholder={t('rhoas-plugin~Search by name...')}
              />
            )}
          </ToolbarItem>
        </ToolbarGroup>
      </ToolbarContent>
    </Toolbar>
  );
};

export default StreamsInstanceFilter;
