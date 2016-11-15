describe('bridge.filter.sysevents', function() {
  'use strict';

  function createEvent(id, involvedObjectName) {
    return {
      id: id,
      object: {
        involvedObject: {
          name: involvedObjectName
        }
      }
    };
  }

  // ---

  var syseventsFilter;

  beforeEach(module('bridge.filter'));
  beforeEach(inject(function(_syseventsFilter_) {
    syseventsFilter = _syseventsFilter_;
  }));

  it('filters by involved object name', function() {
    expect(syseventsFilter(
      // events
      [
        createEvent(2, 'object-2'),
        createEvent(1, 'object-1'),
        createEvent(3, 'object-3'),
        createEvent(1, 'object-1')
      ],

      // query
      {name: 'object-1'})
    ).toEqual([
      createEvent(1, 'object-1'),
      createEvent(1, 'object-1')
    ]);
  });
});
