angular.module('creme.svc')

.constant('MESSAGES', {
  autherror: {
    'default': 'There was an authentication error with the system. Please try again or contact support.',
  },
  auth: {
    'invalid_token': 'There was an error logging you in. Please logout and try again.',
    'default': 'There was an authentication error with the system. Please try again or contact support.',
    'logout_error': 'There was an error logging you out. Please try again.',
  },
  account: {
    'load_error': 'There was an error loading your account information.',
    'payment_error': 'There was a problem storing your payment information. Please try again or contact support.',
    'update_error': 'There was a problem updating your account information. Please try again or contact support.',
    'terminate_error': 'There was a problem terminating your account. Please try again or contact support.',
  },
  contact: {
    'update_error': 'There was a problem updating your contact information. Please try again or contact support.',
  },
  subscription: {
    'load_error': 'There was an error loading your purchased products.',
    'update_error': 'There was a problem updating your product. Please try again or contact support.',
  },
  user: {
    'invite_error': 'There was a problem with the user inviation. Please try again or contact support.',
    'update_error': 'There was a problem updating the user. Please try again or contact support.',
  },
  system: {
    'unavailable': 'The service is currently down. Try again in a moment or contact support.',
  },
})

.constant('UNIT_DISPLAY', {
  'basic-support': {
    label: 'Support via Ticket',
    omitQuantity: true,
  },
  'standard-support': {
    label: '9am-5pm PT Email Support',
    omitQuantity: true,
  },
  'premium-support': {
    label: '24/7 Support',
    omitQuantity: true,
  },
  'software': {
    omitQuantity: true,
  },
})

.constant('SUBSCRIPTION_STATE', {
  PROVISIONED: 0,
  PAID: 1,
  AWAITING_PAYMENT: 2,
  CANCELLED: 3,
  FAILED: 4,
  EXPIRED: 5,
})

.constant('USER_ROLE', {
  READ_ONLY: 0,
  ADMIN: 1,
});
