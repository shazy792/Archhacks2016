var doThis;
var imagePath = 'img/LOGO.png';
var user;
angular.module('braceletApp', ['ngMaterial', 'ui.router']) // dependancies

.config(function($stateProvider, $urlRouterProvider) {

    $stateProvider

    // parent state (bracelet)
        .state('bracelet', {
        url: '/bracelet',
        templateUrl: 'partials/bracelet.html',
        controller: 'braceletCtrl'

    })
    .state('bracelet.admin', {
            url: '/admin',
            templateUrl: 'partials/bracelet-admin.html',

        })
    // children states of bracelet
    .state('bracelet.emergency', {
            url: '/emergency',
            templateUrl: 'partials/bracelet-emergency.html',
            resolve: { // automatically queries all posts before state finishing loading!!
                postPromise: ['postsFactory', function(posts) {
                    return posts.getAll();
                }]
            }
        })
        .state('bracelet.contact', {
            url: '/contact',
            templateUrl: 'partials/bracelet-contact.html',
            resolve: { // automatically queries all posts before state finishing loading!!
                postPromise: ['postsFactory', function(posts) {
                    return posts.getAll();
                }]
            }
        })
        .state('bracelet.login', {
            url: '/login',
            templateUrl: 'partials/bracelet-login.html',


            onEnter: ['$state', 'auth', function($state, auth) {
                if (auth.isLoggedIn()) {
                    $state.go('bracelet.profile');
                }
            }]
        })
        .state('bracelet.register', {
            url: '/register',
            templateUrl: 'partials/bracelet-register.html',

            // onEnter: ['$state', 'auth', function($state, auth){
            //   if(auth.isLoggedIn()){
            //     $state.go('bracelet.home');
            //   }
            // }]
        })
        // TODO
        .state('bracelet.profile', {
            url: '/profile',
            templateUrl: 'partials/bracelet-profile.html'
        })

    .state('bracelet.records', {
        url: '/records',
        templateUrl: 'partials/bracelet-records.html'
    });


    // catches and brings to home page
    $urlRouterProvider.otherwise('/bracelet/home');
})

.factory('postsFactory', function($http, auth) {

    var o = {
        posts: []
    };

    o.getUser = function(){
      return $http.get('/api/rest/:id', {
        headers: {
          Authorization: 'Bearer' + auth.getToken()
        }
      }).success(function(data) {
        angular.copy(data, o.posts);
      });
    };

    o.getAll = function() {
        return $http.get('/api/rest', {
          headers: {
              Authorization: 'Bearer ' + auth.getToken()
          }
      }).success(function(data) {
            angular.copy(data, o.posts);
        });
    };


    o.createPost = function(post) {
        return $http.post('/api/', post, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            o.posts.push(data);
            angular.copy(data, o.posts); // this is required to see the updated DOM!
        });
    };


    o.deletePost = function(id) {
        return $http.delete('/api/' + id, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            angular.copy(data, o.posts);
        }); // in progress
    };

    o.editPost = function(id, edit) {
        return $http.put('/api/' + id, edit, {
            headers: {
                Authorization: 'Bearer ' + auth.getToken()
            }
        }).success(function(data) {
            angular.copy(data, o.posts);
        });
    };
    return o;

})

// authorization factory
.factory('auth', function($http, $window) {
        var auth = {};

        auth.saveToken = function(token) {
            $window.localStorage['cdok-bracelet-token'] = token;
        };

        auth.getToken = function() {
            return $window.localStorage['cdok-bracelet-token'];
        };

        auth.isLoggedIn = function() {
            var token = auth.getToken();

            if (token) {
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload.exp > Date.now() / 1000;
            } else {
                return false;
            }
        };

        auth.currentUser = function() {
            if (auth.isLoggedIn()) {
                var token = auth.getToken();
                var payload = JSON.parse($window.atob(token.split('.')[1]));

                return payload.username;
            }
        };

        auth.register = function(user) {
            return $http.post('/api/auth', user).success(function(data) {
                console.log(data);
                auth.saveToken(data.token);
            });
        };

        auth.logIn = function(user) {
            return $http.post('/api/auth/login', user).success(function(data) {
                auth.saveToken(data.token);
            });
        };

        auth.logOut = function() {
            $window.localStorage.removeItem('cdok-bracelet-token');
        };

        return auth;

    })
    // app controller
    .controller('braceletCtrl', function($scope, $state, $http, postsFactory, auth, $rootScope) { // injecting state to use 'ng-if' on $state.current.name
        $scope.imagePath = 'img/LOGO.png';
        $scope.$state = $state;
        $scope.currentNavItemArray = window.location.href.match(/#\/bracelet\/(\w+)/); // reads from the URL to find the current state to be used in md-nav-bar
        $scope.currentNavItem = $scope.currentNavItemArray[1];
        $scope.isLoggedIn = auth.isLoggedIn;

        $scope.currentUser = auth.currentUser();
        console.log($scope.currentUser);
        $scope.logOut = auth.logOut;


        // TODO trust posts as HTML for formatting
        postsFactory.getAll();
        $scope.posts = postsFactory.posts; // pulls posts from factory into scope
        doThis = $scope.posts;
        console.log(doThis[0]);
        $scope.formData = {}; // initializes form
        console.log($scope.formData.username);
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


        $scope.user = {};

        $scope.register = function() {
            auth.register($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                $state.go('bracelet.profile');
            });
        };

        $scope.logIn = function() {
            auth.logIn($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                console.log($scope.user);
                $scope.popMe = $scope.user.username;
                $scope.userIndex = $scope.popMe[$scope.popMe.length - 1];
                console.log($scope.userIndex);
                $state.go('bracelet.profile');
            });
        };

        $scope.items = [
            "Show Allergies",
            "Show Name",
            "Show Blood-Type",
            "Show Medical History"
        ];



        $scope.issues = [{
            company: 'Peanut Reaction',
            location: 'Toronto, Ontario',
            when: 'Apr 23 , 2016',
            notes: "Saved W Epi Pen"
        }, {
            company: 'Cat Itchiness',
            location: 'Toronto, Ontario',
            when: 'Mar 23 , 2016',
            notes: ""
        }, {
            company: 'Penicillin Reaction',
            location: 'Toronto, Ontario',
            when: 'Feb 23 , 2016',
            notes: "Rash, throat seizing"
        }, {
            company: 'Peanut Reaction',
            location: 'Toronto, Ontario',
            when: 'Jan 23 , 2016',
            notes: "Saved W Epi Pen"
        }];
        $scope.phones = [{
            type: 'Home',
            number: '(555) 251-1234',
            options: {
                icon: 'communication:phone'
            }
        }, {
            type: 'Cell',
            number: '(555) 786-9841',
            options: {
                icon: 'communication:phone',
                avatarIcon: true
            }
        }, {
            type: 'Office',
            number: '(555) 314-1592',
            options: {
                face: imagePath
            }
        }, {
            type: 'Offset',
            number: '(555) 192-2010',
            options: {
                offset: true,
                actionIcon: 'communication:phone'
            }
        }];
        $scope.todos = [{
            face: imagePath,
            what: 'Allergy Alert',
            who: 'Some Guy',
            when: '3:08PM',
            notes: " Use Epi-Pen Mounted to my Belt "
        }, {
            face: imagePath,
            what: 'Seizure',
            who: 'Some Guy',
            when: '3:08PM',
            notes: "2nd instance, same day"
        }, {
            face: imagePath,
            what: 'Seizure',
            who: 'Some Guy',
            when: '1:08PM',
            notes: "Minor Occurance"
        }];

    })

.controller('authCtrl', function($scope, $state, auth, $rootScope) { // injecting state to use 'ng-if' on $state.current.name
        $scope.user = {};

        $scope.register = function() {
            auth.register($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                $state.go('bracelet.profile');
            });
        };

        $scope.logIn = function() {
            auth.logIn($scope.user).error(function(error) {
                $scope.error = error;
            }).then(function() {
                console.log($scope.user);
                $scope.popMe = $scope.user.username;
                $scope.userIndex = $scope.popMe[$scope.popMe.length - 1];
                user = $scope.userIndex;
                $state.go('bracelet.profile');
            });
        };

    })
    .controller('navCtrl', function($scope, $state, auth) { // injecting state to use 'ng-if' on $state.current.name
        $scope.$state = $state;
        $scope.currentNavItemArray = window.location.href.match(/#\/bracelet\/(\w+)/); // reads from the URL to find the current state to be used in md-nav-bar
        $scope.currentNavItem = $scope.currentNavItemArray[1];
        $scope.isLoggedIn = auth.isLoggedIn;
        $scope.currentUser = auth.currentUser;
        $scope.logOut = auth.logOut;
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
