const subnetRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
// t('network-attachment-definition-plugin~Invalid subnet format')
// t('network-attachment-definition-plugin~Invalid IP address or subnet format')
export const validateSubnets = (value: string): string | null => {
  if (!value) {
    return null;
  }

  const subnets = value.split(',').map((subnet) => subnet.trim());

  for (const subnet of subnets) {
    if (!subnetRegex.test(subnet)) {
      return 'Invalid subnet format';
    }
  }
  return null;
};

export const validateIPOrSubnets = (value: string): string | null => {
  if (!value) {
    return null;
  }

  const parts = value.split(',').map((part) => part.trim());

  for (const part of parts) {
    if (!subnetRegex.test(part) && !ipRegex.test(part)) {
      return 'Invalid IP address or subnet format';
    }
  }
  return null;
};
