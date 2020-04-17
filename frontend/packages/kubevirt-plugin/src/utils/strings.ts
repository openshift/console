export const COULD_NOT_LOAD_DATA = 'Could not load data';

export const CREATED = 'created';
export const CREATED_WITH_FAILED_CLEANUP = 'created & failed to clean up';
export const CREATED_WITH_CLEANUP = 'created & cleaned up';
export const FAILED_TO_CREATE = 'failed to create';
export const FAILED_TO_PATCH = 'failed to patch';
export const DYNAMIC = 'Dynamic';

export const EDIT = 'Edit';
export const SAVE = 'Save';
export const ADD = 'Add';

export const ADD_DISK = 'Add Disk';
export const ADD_NETWORK_INTERFACE = 'Add Network Interface';

export const EMPTY_MESSAGE = 'Empty';

export const getDialogUIError = (hasAllRequiredFilled) =>
  hasAllRequiredFilled
    ? 'Please correct the invalid fields.'
    : 'Please fill in all required fields.';

export const getSimpleDialogUIError = (hasAllRequiredFilled) =>
  hasAllRequiredFilled ? 'Some fields are not correct' : 'Required fields not completed';

export const getBooleanReadableValue = (value: boolean) => (value ? 'yes' : 'no');

export const getBooleanAsEnabledValue = (value: boolean) => (value ? 'Enabled' : 'Not Enabled');

export const getSequenceName = (name: string, usedSequenceNames?: Set<string>) => {
  if (!usedSequenceNames) {
    return `${name}${0}`;
  }

  for (let i = 0; i < usedSequenceNames.size + 1; i++) {
    const sequenceName = `${name}${i}`;
    if (!usedSequenceNames.has(sequenceName)) {
      return sequenceName;
    }
  }
  return null;
};

export const pluralize = (i: number, singular: string, plural: string = `${singular}s`) =>
  i === 1 ? singular : plural;

export const intervalBracket = (isInclusive: boolean, leftValue?: number, rightValue?: number) => {
  if (leftValue) {
    return isInclusive && Number.isFinite(leftValue) ? '[' : '(';
  }

  return isInclusive && Number.isFinite(rightValue) ? ']' : ')';
};

export const createUniqueNameResolver = (data: { name: string }[]) => {
  const nameCounts = (data || [])
    .filter(({ name }) => name)
    .reduce((acc, { name }) => {
      if (acc[name]) {
        acc[name].max++;
      } else {
        acc[name] = { max: 1, next: 1 };
      }
      return acc;
    }, {});

  return (name: string) => {
    if (!name) {
      return name;
    }
    if (nameCounts[name].max === 1) {
      return name;
    }
    nameCounts[name].next++;
    return `${name}-${nameCounts[name].next - 1}`;
  };
};
