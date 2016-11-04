angular.module('braceletApp', ['ngMaterial', 'ui.router']) // dependancies

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

    // parent state (bracelet)
        .state('bracelet', {
        url: '/bracelet',
        templateUrl: 'partials/bracelet.html',
        controller: 'braceletCtrl'

    })

    // children states of bracelet
    .state('bracelet.home', {
            url: '/home',
            templateUrl: 'partials/bracelet-home.html',
            resolve: { // automatically queries all posts before state finishing loading!!
                postPromise: ['postsFactory', function(posts) {
                    return posts.getAll();
                }]
            }
        })
        .state('bracelet.posts', {
            url: '/posts',
            templateUrl: 'partials/bracelet-posts.html',
            resolve: { // automatically queries all posts before state finishing loading!!
                postPromise: ['postsFactory', function(posts) {
                    return posts.getAll();
                }]
            }
        })
        .state('bracelet.adminlogin', {
                url: '/adminlogin',
                templateUrl: 'partials/bracelet-login.html',
                controller: 'authCtrl',
                onEnter: ['$state', 'auth', function($state, auth){
                  if(auth.isLoggedIn()){
                    $state.go('bracelet.home');
                  }
                }]
            })
        // .state('bracelet.register', {
        //     url: '/register',
        //     templateUrl: 'partials/bracelet-register.html',
        //     controller: 'authCtrl',
        //     onEnter: ['$state', 'auth', function($state, auth){
        //       if(auth.isLoggedIn()){
        //         $state.go('bracelet.home');
        //       }
        //     }]
        // })
        // TODO
        .state('bracelet.about', {
            url: '/about',
            templateUrl: 'partials/bracelet-about.html',
        })
        .state('bracelet.new', {
            url: '/new',
            templateUrl: 'partials/bracelet-new.html'
        })
        .state('bracelet.post', { // state for clicking specific posts
            url: '/posts/{id}',
            templateUrl: '/partials/bracelet-post.html',
            resolve: { // detects we are entienring the posts staet and then will query for the full post object
                post: ['$stateParams', 'postsFactory', function($stateParams, postsFactory) {
                    return postsFactory.get($stateParams.id);
                }]
            }
        });

    // catches and brings to home page
    $urlRouterProvider.otherwise('/bracelet/home');
})

.factory('postsFactory', function($http, auth) {

        var o = {
            posts: []
        };

        o.getAll = function() {
            return $http.get('/api/posts').success(function(data) {
                angular.copy(data, o.posts);
            });
        };

        o.get = function(id) { // clicking a specific post
            return $http.get('/api/posts/' + id)
            .success(function(data) {
                angular.copy(data, o.posts);
            });
        };

        o.createPost = function(post) {
            return $http.post('/api/posts/', post, {
              headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).success(function(data) {
                o.posts.push(data);
                angular.copy(data, o.posts); // this is required to see the updated DOM!
            });
        };


        o.deletePost = function(id) {
            return $http.delete('/api/posts/' + id, {
              headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).success(function(data) {
                angular.copy(data, o.posts);
            }); // in progress
        };

        o.editPost = function(id, edit) {
            return $http.put('/api/posts/' + id, edit, {
              headers: {Authorization: 'Bearer ' + auth.getToken()}
            }).success(function(data) {
                angular.copy(data, o.posts);
            });
        };
        return o;

    })

    // authorization factory
    .factory('auth', function($http,$window){
      var auth = {};

      auth.saveToken = function(token){
        $window.localStorage['cdok-bracelet-token'] = token;
      };

      auth.getToken = function(){
        return $window.localStorage['cdok-bracelet-token'];
      };

      auth.isLoggedIn = function(){
        var token = auth.getToken();

        if(token){
          var payload = JSON.parse($window.atob(token.split('.')[1]));

          return payload.exp > Date.now() / 1000;
        } else {
          return false;
        }
      };

      auth.currentUser = function(){
        if(auth.isLoggedIn()){
        var token = auth.getToken();
        var payload = JSON.parse($window.atob(token.split('.')[1]));

        return payload.username;
      }
    };

    auth.register = function(user){
      return $http.post('/api/register', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logIn = function(user){
      return $http.post('/api/login', user).success(function(data){
        auth.saveToken(data.token);
      });
    };

    auth.logOut = function(){
      $window.localStorage.removeItem('cdok-bracelet-token');
    };

    return auth;

    })
    // app controller
    .controller('braceletCtrl', function($scope, $state, $http, postsFactory, auth, staticFactory) { // injecting state to use 'ng-if' on $state.current.name

        $scope.$state = $state;
        $scope.currentNavItemArray = window.location.href.match(/#\/bracelet\/(\w+)/); // reads from the URL to find the current state to be used in md-nav-bar
        $scope.currentNavItem = $scope.currentNavItemArray[1];
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;


        // TODO trust posts as HTML for formatting
        $scope.posts = postsFactory.posts; // pulls posts from factory into scope
        $scope.formData = {}; // initializes form

        $scope.addPost = function() {
            postsFactory.createPost($scope.formData);
            $scope.formData = {};
        };
        $scope.deletePost = function(id) {
            var r = confirm("Are you sure you want to delete this post?");
            if (r === true) {
                postsFactory.deletePost(id);
            } else {
                alert("Not deleted");
            }

        };
        $scope.updatePost = function(id, newTitle, newBody) {
            $scope.newPost = {};
            $scope.newPost.title = newTitle;
            $scope.newPost.body = newBody;
            var r = confirm("Are you sure you want to edit this post?");
            if (r === true) {
              postsFactory.editPost(id, $scope.newPost);
            } else {
                alert("Not deleted");
            }
        };

    })

    .controller('authCtrl', function($scope, $state, auth) { // injecting state to use 'ng-if' on $state.current.name
      $scope.user = {};

      $scope.register = function(){
        auth.register($scope.user).error(function(error){
          $scope.error = error;
        }).then(function(){
          $state.go('bracelet.home');
        });
      };

      $scope.logIn = function(){
        auth.logIn($scope.user).error(function(error){
          $scope.error = error;
        }).then(function(){
          $state.go('bracelet.home');
        });
      };

    })


.config(function($mdThemingProvider, $mdIconProvider) {
    $mdThemingProvider.theme('forest') // to create themes (possibly modular for the user later)
        .primaryPalette('brown')
        .accentPalette('green');
})

.directive('userAvatar', function() {
    return {
        replace: true,
        template: '<svg class="user-avatar" viewBox="0 0 128 128" height="64" width="64" pointer-events="none" display="block" > <path fill="#FF8A80" d="M0 0h128v128H0z"/> <path fill="#FFE0B2" d="M36.3 94.8c6.4 7.3 16.2 12.1 27.3 12.4 10.7-.3 20.3-4.7 26.7-11.6l.2.1c-17-13.3-12.9-23.4-8.5-28.6 1.3-1.2 2.8-2.5 4.4-3.9l13.1-11c1.5-1.2 2.6-3 2.9-5.1.6-4.4-2.5-8.4-6.9-9.1-1.5-.2-3 0-4.3.6-.3-1.3-.4-2.7-1.6-3.5-1.4-.9-2.8-1.7-4.2-2.5-7.1-3.9-14.9-6.6-23-7.9-5.4-.9-11-1.2-16.1.7-3.3 1.2-6.1 3.2-8.7 5.6-1.3 1.2-2.5 2.4-3.7 3.7l-1.8 1.9c-.3.3-.5.6-.8.8-.1.1-.2 0-.4.2.1.2.1.5.1.6-1-.3-2.1-.4-3.2-.2-4.4.6-7.5 4.7-6.9 9.1.3 2.1 1.3 3.8 2.8 5.1l11 9.3c1.8 1.5 3.3 3.8 4.6 5.7 1.5 2.3 2.8 4.9 3.5 7.6 1.7 6.8-.8 13.4-5.4 18.4-.5.6-1.1 1-1.4 1.7-.2.6-.4 1.3-.6 2-.4 1.5-.5 3.1-.3 4.6.4 3.1 1.8 6.1 4.1 8.2 3.3 3 8 4 12.4 4.5 5.2.6 10.5.7 15.7.2 4.5-.4 9.1-1.2 13-3.4 5.6-3.1 9.6-8.9 10.5-15.2M76.4 46c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6zm-25.7 0c.9 0 1.6.7 1.6 1.6 0 .9-.7 1.6-1.6 1.6-.9 0-1.6-.7-1.6-1.6-.1-.9.7-1.6 1.6-1.6z"/> <path fill="#E0F7FA" d="M105.3 106.1c-.9-1.3-1.3-1.9-1.3-1.9l-.2-.3c-.6-.9-1.2-1.7-1.9-2.4-3.2-3.5-7.3-5.4-11.4-5.7 0 0 .1 0 .1.1l-.2-.1c-6.4 6.9-16 11.3-26.7 11.6-11.2-.3-21.1-5.1-27.5-12.6-.1.2-.2.4-.2.5-3.1.9-6 2.7-8.4 5.4l-.2.2s-.5.6-1.5 1.7c-.9 1.1-2.2 2.6-3.7 4.5-3.1 3.9-7.2 9.5-11.7 16.6-.9 1.4-1.7 2.8-2.6 4.3h109.6c-3.4-7.1-6.5-12.8-8.9-16.9-1.5-2.2-2.6-3.8-3.3-5z"/> <circle fill="#444" cx="76.3" cy="47.5" r="2"/> <circle fill="#444" cx="50.7" cy="47.6" r="2"/> <path fill="#444" d="M48.1 27.4c4.5 5.9 15.5 12.1 42.4 8.4-2.2-6.9-6.8-12.6-12.6-16.4C95.1 20.9 92 10 92 10c-1.4 5.5-11.1 4.4-11.1 4.4H62.1c-1.7-.1-3.4 0-5.2.3-12.8 1.8-22.6 11.1-25.7 22.9 10.6-1.9 15.3-7.6 16.9-10.2z"/> </svg>'
    };
});
