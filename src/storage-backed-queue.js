angular.module('storage-backed-queue',['storage-backed-object'])
  .factory('StorageBackedQueue', function(StorageBackedObject) {
    var funcs = {};
    var running = false;
    var timeout = 5 * 1000;

    var StorageBackedQueue = function(globalName, instanceName) {
      this.globalName = globalName
      this.instanceName = instanceName;

      // Same storage shared by all queues      
      this.storage = StorageBackedObject(this.globalName);
      this.saveRequests(this.getRequests() || []);
    };

    StorageBackedQueue.prototype.funcName = function() {
      return this.globalName + '---' + this.instanceName;
    };

    StorageBackedQueue.prototype.getRequests = function() {
      return this.storage.get('requests');
    }

    StorageBackedQueue.prototype.saveRequests = function(requests) {
      return this.storage.set('requests', requests);
    }    

    StorageBackedQueue.prototype.register = function(func) {
      funcs[this.funcName()] = func;
    };

    // Does not return a promise, as can't be guarenteed to run
    // after a restart
    StorageBackedQueue.prototype.next = function(params) {
      this.push(params);
      return this.runNext();
    };

    StorageBackedQueue.prototype.runNext = function() {
      var self = this;
      var next = this.getRequests()[0];

      // funcs[next.name] might not be defined until all the registration functions
      // have been run.
      if (!running && next && funcs[next.name]) {
        running = true;
        return funcs[next.name](next.params).then(function() {
          console.log('success');
          self.shift();
          running = false;
          self.runNext();
        }, function(rejection) {
          console.log('fail',rejection);
          // If a failure, retry after timeout. Will be the same function
          return $timeout(function() {
            running = false;
            return self.runNext();
          }, timeout);
        });
      };
    }

    StorageBackedQueue.prototype.push = function(params) {
      var requests = this.getRequests();
      requests.push({
        name: this.funcName(), 
        params: params
      });
      console.log('saving requests',requests);
      this.saveRequests(requests);   
    }

    StorageBackedQueue.prototype.shift = function() {
      var requests = this.getRequests();
      requests.shift();
      this.saveRequests(requests);      
    }

    return function(globalName, instanceName) {
      return StorageBackedQueue[instanceName] || (StorageBackedQueue[instanceName] = new StorageBackedQueue(globalName,instanceName));
    }
  });