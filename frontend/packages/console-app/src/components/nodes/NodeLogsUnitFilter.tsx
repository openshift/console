import * as React from 'react';
import { Label, LabelGroup, TextInput, ToolbarItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getQueryArgument } from '@console/internal/components/utils';

type NodeLogsUnitFilterProps = {
  onChangeUnit: (value: string) => void;
  unit: string;
};

const NodeLogsUnitFilter: React.FC<NodeLogsUnitFilterProps> = ({ onChangeUnit }) => {
  const firstRender = React.useRef(true);
  const inputRef = React.useRef<HTMLInputElement>();
  const [values, setValues] = React.useState<string[]>(getQueryArgument('unit')?.split(',') || []);
  const { t } = useTranslation();

  React.useEffect(() => {
    const input = inputRef.current;
    const listener = (event) => {
      const { value } = event.currentTarget;
      if ((event.code === 'Enter' || event.code === 'NumpadEnter') && value !== '') {
        event.preventDefault();
        setValues((prevValues) => _.uniq([...prevValues, value]));
        event.currentTarget.value = '';
      }
    };
    input.addEventListener('keydown', listener);
    return () => {
      input.removeEventListener('keydown', listener);
    };
  }, [onChangeUnit]);

  const deleteValue = (id: string) => {
    const index = values.indexOf(id);
    if (index !== -1) {
      setValues((prevValues) => {
        const newValues = [...prevValues];
        newValues.splice(index, 1);
        return newValues;
      });
    }
  };

  const deleteCategory = () => {
    setValues([]);
  };

  const valuesString = values.join(',');
  React.useEffect(() => {
    if (!firstRender.current) {
      onChangeUnit(valuesString);
    } else {
      firstRender.current = false;
    }
  }, [valuesString, onChangeUnit]);

  const label = t('public~Filter by unit');

  return (
    <>
      <ToolbarItem>
        <TextInput
          type="text"
          id="log-unit"
          name="log-unit"
          aria-label={label}
          ref={inputRef}
          placeholder={label}
        />
      </ToolbarItem>
      {values.length > 0 && (
        <ToolbarItem>
          <LabelGroup categoryName={t('public~Unit')} isClosable onClick={deleteCategory}>
            {values?.map((v) => (
              <Label variant="outline" key={v} onClose={() => deleteValue(v)}>
                {v}
              </Label>
            ))}
          </LabelGroup>
        </ToolbarItem>
      )}
    </>
  );
};

export default NodeLogsUnitFilter;
