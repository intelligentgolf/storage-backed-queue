storage-backed-queue [![Build Status](https://api.travis-ci.org/intelligentgolf/storage-backed-queue.png?branch=master)](https://travis-ci.org/intelligentgolf/storage-backed-queue) [![Coverage Status](https://coveralls.io/repos/intelligentgolf/storage-backed-queue/badge.png)](https://coveralls.io/r/intelligentgolf/storage-backed-queue)
====================

AngularJS service that persists and retries a queue of promise-based asynchronous function calls to HTML5 storage.

This can be useful when you need to ensure calls to $http are succesful, along with their `then` success callback, even after a browser restart, or after failed requests due to a dropped internet connection.

Because failures are automatically retried, recoverable failures of $http, such as from insufficient permissions due to a session expiring, should be handled using http interceptors. You should ensure that any requests are idempotent on the server, as the browser treating a request as failed might have been succesful from the server's point of view.

Installation
------------

The easiest way to install is be using [Bower](http://bower.io/), which downloads all the requied dependencies

    bower install intelligentgolf/storage-backed-queue --save

Usage
-----

Add the dependency to your AngularJS app:

    // Add module dependency 
    angular.module('myApp', ['storage-backed-queue']);
    
Then use it by injecting `StorageBackedQueue` into your services:
    
    angular.service('MyService', function(StorageBackedQueue) {
      // Use StorageBackedQueue
    });
    
To allow queues to be reconstructed after a browser restart, functions must be registered with a unique identifier.

    var sbQueue = StorageBackedQueue('requests');
    
    sbQueue.register('http', function(params) {
      return $http(params).then(function(results) {
    	// Process results;
      });
    });
    
Then to add a function call to the queue, unique identifier must be passed to `run`, along with the parameters to pass to the registered function.
    
    sbQueue.run('http', {
    	'method': 'POST',
    	'url': '/someUrl',
    	'data': {'key': 'value'}
    });
    
After a browser restart, once a function has been (re)-registered, then its queue will be processed, recovering any past queued parameters from HTML5 storage.


Limitations
-----------

Parameters passed to the queue are stored in HTML5 storage, and so must be JSON encodable, and completely reconstructable from JSON encode -> JSON decode path. This means they cannot hold circular references, or references to functions.



