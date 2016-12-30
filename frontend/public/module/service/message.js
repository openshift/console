const messages = {
  auth: {
    'invalid_code': 'There was an error logging you in. Please log out and try again.',
    'default': 'There was an authentication error with the system. Please try again or contact support.',
    'logout_error': 'There was an error logging you out. Please try again.',
  },
};

export const getMessage = (type, id) => _.get(messages, `${type}.${id}`) || _.get(messages, `${type}.default`) || '';
