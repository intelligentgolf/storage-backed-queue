angular.module('storage-backed-queue',['storage-backed-object'])
  .factory('StorageBackedQueue', function(StorageBackedObject, $timeout) {
    var timeout = 5 * 1000;
    var queueKey = 'queue';

    var StorageBackedQueue = function(globalName_, instanceName_) {

      /* Private members */

      var globalName = globalName_;
      var instanceName = instanceName_;
      var storage = StorageBackedObject(globalName);
      var funcs = {};
      var running = false;

      /* Private methods */

      var push = function(functionId, params) {
        var queue = getQueue();
        queue.push({
          functionId: functionId, 
          params: angular.copy(params)
        });
        saveQueue(queue);   
      }

      var shift = function() {
        var queue = getQueue();
        queue.shift();
        saveQueue(queue);      
      }

      var getQueue= function() {
        return storage.get(queueKey,[]);
      }

      var saveQueue = function(queue) {
        return storage.set(queueKey, queue);
      }  

      var runNext = function() {
        var next = getQueue()[0];
        if (running || !next || !funcs[next.functionId]) return;
        running = true;
        return funcs[next.functionId](next.params).then(function() {
          shift();
          running = false;
          runNext();
        }, function(rejection) {
          return $timeout(function() {
            running = false;
            return runNext();
          }, timeout);
        });

      }

      /* Public methods */

      this.register = function(functionId, func) {
        funcs[functionId] = func;
        runNext();
      };

      this.clearQueue = function() {
        return storage.set(queueKey,[]);
      }

      this.run = function(functionId, params) {
        push(functionId, params);
        return runNext();
      };
    };

    return function(globalName) {
      return StorageBackedQueue[globalName] || (StorageBackedQueue[globalName] = new StorageBackedQueue(globalName));
    }
  });