"use strict";

describe('StorageBackedQueue', function () {

  beforeEach(module('storage-backed-queue'));

  var StorageBackedQueue, StorageBackedObject, sbQueue, $q, $rootScope, $timeout;
  var globalQueueName = 'storage-queue';
  var defer1, defer2, func;
  var functionId = 'test-function';
  var param1 = {'test':'val1'}
  var param2 = {'test':'val2'};

  beforeEach(inject(function (_StorageBackedQueue_, _StorageBackedObject_, _$q_, _$rootScope_, _$timeout_) {
    $q = _$q_;
    $rootScope = _$rootScope_;
    $timeout = _$timeout_;
    StorageBackedQueue = _StorageBackedQueue_;
    StorageBackedObject = _StorageBackedObject_;
    sbQueue = StorageBackedQueue(globalQueueName);
  }));

  beforeEach(function() {
    defer1 = $q.defer();
    defer2 = $q.defer();
    func = jasmine.createSpy().andCallFake(function(param) {
      return defer1.promise;
    });
  });

  describe('Registered function', function() {
    beforeEach(function() {
      sbQueue.register(functionId, func);
    });

    afterEach(function() {
      sbQueue.clearQueue();
    })

    it('after calling run it should be called', function() {
      sbQueue.run(functionId, param1);
      expect(func).toHaveBeenCalledWith(param1);
    });

    it('after calling run the registered function should only be called after the first promise resolved', function() {
      sbQueue.run(functionId, param1);
      sbQueue.run(functionId, param2);
      expect(func).not.toHaveBeenCalledWith(param2);
      defer1.resolve();
      $rootScope.$apply();
      expect(func).toHaveBeenCalledWith(param2);
    });

  });

  describe('After a browser restart', function() {
    var sbObject;

    beforeEach(function() {
      // Manually populate the storage backed object
      // faking a browser restart. Fragile to 
      // implemenetation of StorageBackedObject
      sbObject = StorageBackedObject(globalQueueName);
      sbObject.set('queue', [{
          functionId: functionId, 
          params: param1
      }]);
      sbQueue.register(functionId, func);
    });

    it('the registered function is called', function() {
      $rootScope.$apply();
      expect(func).toHaveBeenCalledWith(param1);
    });
  });

  describe('After a failed registered function call', function() {
    it('the function is retried', function() {
      sbQueue.register(functionId, func);
      sbQueue.run(functionId, param1);
      expect(func).toHaveBeenCalledWith(param1);
      func.reset();

      defer1.reject();
      $rootScope.$apply();
      $timeout.flush();
      expect(func).toHaveBeenCalledWith(param1);
    });
  });

});
