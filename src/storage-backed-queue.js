'use strict';

angular.module('storage-backed-queue', ['storage-backed-object'])
  .factory('StorageBackedQueue', function (StorageBackedObject, $timeout) {
    var timeout = 5 * 1000;
    var queueKey = 'queue';

    var StorageBackedQueue = function (globalName_) {

      /* Private members */

      var globalName = globalName_;
      var storage = StorageBackedObject(globalName);
      var funcs = {};
      var running = false;

      /* Private methods */
      var push, shift, getQueue, saveQueue, runNext;

      push = function (functionId, params) {
        var queue = getQueue();
        queue.push({
          functionId: functionId,
          params: angular.copy(params)
        });
        saveQueue(queue);
      };

      shift = function () {
        var queue = getQueue();
        queue.shift();
        saveQueue(queue);
      };

      getQueue = function () {
        return storage.get(queueKey, []);
      };

      saveQueue = function (queue) {
        return storage.set(queueKey, queue);
      };

      runNext = function () {
        var next = getQueue()[0];
        if (running || !next || !funcs[next.functionId]) {
          return;
        }
        running = true;
        return funcs[next.functionId](next.params).then(function () {
          shift();
          running = false;
          runNext();
        }, function () {
          return $timeout(function () {
            running = false;
            return runNext();
          }, timeout);
        });
      };

      /* Public methods */

      this.register = function (functionId, func) {
        funcs[functionId] = func;
        runNext();
      };

      this.clearQueue = function () {
        return storage.set(queueKey, []);
      };

      this.run = function (functionId, params) {
        push(functionId, params);
        return runNext();
      };
    };

    return function (globalName) {
      StorageBackedQueue[globalName] = StorageBackedQueue[globalName] || new StorageBackedQueue(globalName);
      return StorageBackedQueue[globalName];
    };
  });