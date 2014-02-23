angular.module('storage-backed-queue',['storage-backed-object'])
  .factory('StorageBackedQueue', function(StorageBackedObject, $timeout) {
    var funcs = {};
    var running = false;
    var timeout = 5 * 1000;
    var queueKey = 'queue';

    var StorageBackedQueue = function(globalName_, instanceName_) {

      /* Private members */

      var globalName = globalName_;
      var instanceName = instanceName_;
      var storage = StorageBackedObject(globalName);

      /* Private methods */

      var push = function(params) {
        var queue = getQueue();
        queue.push({
          name: funcName(), 
          params: params
        });
        saveQueue(queue);   
      }

      var shift = function() {
        var queue = getQueue();
        queue.shift();
        saveQueue(queue);      
      }

      var funcName = function() {
        return globalName + '---' + instanceName;
      };

      var getQueue= function() {
        return storage.get(queueKey,[]);
      }

      var saveQueue = function(queue) {
        return storage.set(queueKey, queue);
      }  

      var runNext = function() {
        var next = getQueue()[0];
        var run = !running && next && funcs[next.name];

        if (run) {
          running = true;
          return funcs[next.name](next.params).then(function() {
            shift();
            running = false;
            runNext();
          }, function(rejection) {
            return $timeout(function() {
              running = false;
              return runNext();
            }, timeout);
          });
        };
      }

      /* Public methods */

      this.register = function(func) {
        funcs[funcName()] = func;
        runNext();
      };

      this.clearQueue = function() {
        return storage.set(queueKey,[]);
      }

      this.run = function(params) {
        push(params);
        return runNext();
      };
    };

    return function(globalName, instanceName) {
      return StorageBackedQueue[instanceName] || (StorageBackedQueue[instanceName] = new StorageBackedQueue(globalName,instanceName));
    }
  });