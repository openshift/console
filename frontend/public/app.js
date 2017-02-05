import {analyticsSvc} from './module/analytics';

window.onerror = function (message, source, lineno, colno) {
  try {
    var e = `${message} ${source} ${lineno} ${colno}`;
    analyticsSvc.error(e);
  }
  catch(err) {
    try {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    catch (ignored) {
      // ignore
    }
  }
};

// TODO
//$rootScope.$on('$routeChangeSuccess', function() {
//  analyticsSvc.route(location.pathname);
//});

// TODO
//$rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
//  switch(rejection) {
//    case 'not-logged-in':
//      $window.location.href = $window.SERVER_FLAGS.loginURL;
//      break;
//  }
//});
