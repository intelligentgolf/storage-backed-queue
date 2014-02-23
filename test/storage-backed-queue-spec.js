"use strict";

describe('StorageBackedQueue', function () {

  beforeEach(module('storage-backed-queue'));

  var StorageBackedQueue, StorageBackedObject, sbQueue, $q, $rootScope;
  var globalQueue = 'storage-queue';
  var thisInstance = 'instance';
  var defer1, defer2, func;
  var param1 = {'test':'val1'}, param2 = {'test':'val2'};

  beforeEach(inject(function (_StorageBackedQueue_, _StorageBackedObject_, _$q_, _$rootScope_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    StorageBackedQueue = _StorageBackedQueue_;
    StorageBackedObject = _StorageBackedObject_;
    sbQueue = StorageBackedQueue(globalQueue, thisInstance);
  }));

  beforeEach(function() {
    defer1 = $q.defer();
    defer2 = $q.defer();
    func = jasmine.createSpy().andCallFake(function(param) {
      return defer1.promise;
    });
  });

  describe('Registering function', function() {
    beforeEach(function() {
      sbQueue.register(func);
    });

    afterEach(function() {
      sbQueue.clearQueue();
    })

    it('after calling next the registered function should be called', function() {
      sbQueue.run(param1);
      expect(func).toHaveBeenCalledWith(param1);
    });

    it('after calling next the registered function should only be called after the first promise resolved', function() {
      sbQueue.run(param1);
      sbQueue.run(param2);
      expect(func).not.toHaveBeenCalledWith(param2);
      defer1.resolve();
      $rootScope.$apply();
      expect(func).toHaveBeenCalledWith(param2);
    });

  });

  describe('After a browser restart', function() {
    var sbObject;

    var getFuncName = function(globalName, instanceName) {
      return globalName + '---' + instanceName;
    };

    beforeEach(function() {
      // Manually populate the storage backed object
      // faking a browser restart. Fragile to 
      // implemenetation of StorageBackedObject
      sbObject = StorageBackedObject(globalQueue);
      sbObject.set('queue', [{
          name: getFuncName(globalQueue, thisInstance), 
          params: param1
      }]);

      sbQueue.register(func);
    });

    it('the registered function is called', function() {
       $rootScope.$apply();
       expect(func).toHaveBeenCalledWith(param1);
    });
  });


});
