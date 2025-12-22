import type { FC } from 'react';
import { useRef, useState, useEffect } from 'react';
import { FlexItem, Label, LabelGroup, TextInput } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { getQueryArgument } from '@console/internal/components/utils/router';

type NodeLogsUnitFilterProps = {
  onChangeUnit: (value: string) => void;
  unit: string;
};

const NodeLogsUnitFilter: FC<NodeLogsUnitFilterProps> = ({ onChangeUnit }) => {
  const firstRender = useRef(true);
  const inputRef = useRef<HTMLInputElement>();
  const [values, setValues] = useState<string[]>(getQueryArgument('unit')?.split(',') || []);
  const { t } = useTranslation();

  useEffect(() => {
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
  useEffect(() => {
    if (!firstRender.current) {
      onChangeUnit(valuesString);
    } else {
      firstRender.current = false;
    }
  }, [valuesString, onChangeUnit]);

  const label = t('public~Filter by unit');

  return (
    <>
      <FlexItem>
        <TextInput
          type="text"
          id="log-unit"
          name="log-unit"
          aria-label={label}
          ref={inputRef}
          placeholder={label}
        />
      </FlexItem>
      {values.length > 0 && (
        <FlexItem>
          <LabelGroup categoryName={t('public~Unit')} isClosable onClick={deleteCategory}>
            {values?.map((v) => (
              <Label variant="outline" key={v} onClose={() => deleteValue(v)}>
                {v}
              </Label>
            ))}
          </LabelGroup>
        </FlexItem>
      )}
    </>
  );
};

export default NodeLogsUnitFilter;
