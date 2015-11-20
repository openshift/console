angular.module('bridge.const')
.constant('CONST', {
  title: 'Bridge',
  dateFmt: 'MM-dd-yyyy',
  timeFmt: 'HH:mm:ss a Z',
  dateTimeFmt: 'MMM d, h:mm a',
  // This format is for moment, not Angularjs.
  dateTimeFmtUTC: 'MMM DD, H:mm A z',
  placeholderText: '-',
});
