// Code goes here
var musicApp = angular.module("musicApp", ["ngRoute", "ui.bootstrap"]);
musicApp.config(
  function ($routeProvider) {
      $routeProvider.when("/list", {
          templateUrl: "list.html",
          controller: "listCtrl"
      }).when("/Items/add", {
          templateUrl: "detail.html",
          controller: "addCtrl"
        }).when("/Items/edit/:index", {
            templateUrl: "detail.html",
            controller: "editCtrl"
        }).otherwise({
            redirectTo: "/list"
        })
  }
);

musicApp.factory("sharepointConstants", ["$rootScope", "$http", "$q",
  function ($rootScope, $http, $q) {
      var appWebUrl;
      var hostWebUrl;
      var formDigest = null;

      getQueryStringParameter = function (urlParameterKey) {
          var params = document.URL.split("?")[1].split("&");
          var strParams = "";
          for (var i = 0; i < params.length; i = i + 1) {
              var singleParam = params[i].split("=");
              if (singleParam[0] == urlParameterKey)
                  return singleParam[1];
          }
      }

      getAppWebUrl = function() {
          return appWebUrl;
      }

      getHostWebUrl = function() {
          return hostWebUrl;
      }

      getformDigest = function () {
          return formDigest;
      }

      initConstants = function () {
          var deferred = $q.defer();
          appWebUrl = decodeURIComponent(getQueryStringParameter("SPAppWebUrl")).split("#")[0];
          hostWebUrl = decodeURIComponent(getQueryStringParameter("SPHostUrl")).split("#")[0];
          if (formDigest != null)
              deferred.resolve();
          else {
              //?$select=FormDigestValue
              var url = appWebUrl + "/_api/contextinfo";
              $http({
                  url: url,
                  method: "POST",
                  data: {},
                  headers:
                  {
                      "accept": "application/json; odata=verbose",
                      "content-type": "application/json;odata=verbose;charset=utf-8"
                  }
              }).then(function (d) {
                  formDigest = d.data.d.GetContextWebInformation.FormDigestValue;
                  deferred.resolve();
              },
              function (error) {
                  deferred.reject(error);
              });
          }
          return deferred.promise;
      }
      return {
          initConstants: initConstants,
          getAppWebUrl : getAppWebUrl,
          getHostWebUrl, getHostWebUrl,
          getformDigest, getformDigest
      }
  }]
);
musicApp.factory("sharepointListService", ["$http", "sharepointConstants",
  function ($http, sharepointConstants) {
      getItems = function (listName, columns) {
          var listItems = [];
          fDigest = sharepointConstants.getformDigest();
          var appWebUrl = sharepointConstants.getAppWebUrl();
          var url = "";
          if (columns !== "") {
              var url = appWebUrl + "/_api/web/Lists/getbytitle('$LISTNAME$')/Items" + "?select=" + columns;
          }
          else {
              var url = appWebUrl + "/_api/web/Lists/getbytitle('$LISTNAME$')/Items";
          }
          url = url.replace("$LISTNAME$", listName);

          return $http({
              method: "GET",
              url: url,
              headers: {
                  "Accept": "application/json; odata=verbose"
              }
          });
      }

      getItem = function (listName, id) {
          var appWebUrl = sharepointConstants.getAppWebUrl();
          var url = appWebUrl + "/_api/web/Lists/getbytitle('$LISTNAME$')/items(" + id + ")";
          url = url.replace("$LISTNAME$", listName);
          
          return $http({
              method: "GET",
              url: url,
              headers: {
                  "Accept": "application/json; odata=verbose"
              }
          });
      }

      addItem = function (listName, item) {
          var fDigest = sharepointConstants.getformDigest();
          var appWebUrl = sharepointConstants.getAppWebUrl();
          var url = appWebUrl + "/_api/web/Lists/getbytitle('$LISTNAME$')/items";
          url = url.replace("$LISTNAME$", listName);

          return $http.post(
                  url,
                  item,
                  {
                      headers: {
                          "Accept": "application/json; odata=verbose",
                          "X-RequestDigest": fDigest
                      }
                  });
      }

      updateItem = function (listName, id, item) {
          var fDigest = sharepointConstants.getformDigest();
          var appWebUrl = sharepointConstants.getAppWebUrl();
          var url = appWebUrl + "/_api/web/Lists/getbytitle('$LISTNAME$')/items(" + id + ")";
          url = url.replace("$LISTNAME$", listName);

          return $http.post(
                  url,
                  item,
                  {
                      headers: {
                          "Accept": "application/json; odata=verbose",
                          "X-RequestDigest": fDigest,
                          "X-HTTP-Method": "MERGE",
                          "IF-MATCH": "*"
                      }
                  });
      }

      return {
          addItem: addItem,
          updateItem: updateItem,
          getItems: getItems,
          getItem: getItem
      }
  }]);

musicApp.factory("sharepointService", ["$q", "sharepointListService",
  function ($q, sharepointListService) {
      var artists = null;
      var genres = null;

      //artist operations
      createArtistCollection = function (data) {
          artists = [];
          $(data).each(function (i, e) {
              artists.push({
                  id: e["Id"],
                  name: e["Title"],
                  genre: e["Genre"],
                  rating: e["Rating"]
              });
          });
          return artists;
      }

      createArtist = function (data) {
          var artist = {
              id: data["Id"],
              name: data["Title"],
              genre: data["Genre"],
              rating: data["Rating"]
          }
          return artist;
      }
      updateArtistList = function (artist) {
          for (i = 0; i < artists.length; i++) {
              if (artist.id === artists[i].id) {
                  artists[i].name = artist.name;
                  artists[i].rating = artist.rating;
                  artists[i].genre = artist.genre;
                  break;
              }
          }
      }
      getArtists = function () {
          var deferred = $q.defer();
          if (artists != null)
              deferred.resolve(artists);
          else {
              sharepointListService.getItems("Artists", "Title,Genre,Rating").then(
                      function (d) {
                          var artists = createArtistCollection(d.data.d.results);
                          deferred.resolve(artists);
                      },
                      function (error) { deferred.reject(error); }
              );
          }
          return deferred.promise;
      };
      //add artist
      addArtist = function (artist) {
          var deferred = $q.defer();
          var item = { "Title": artist.name, "Genre": artist.genre, "Rating": artist.rating };
          sharepointListService.addItem("Artists", item).then(
                      function (d) {
                          artist.id = d.data.d.ID;
                          artists.push(artist);
                          deferred.resolve();
                      },
                      function (error) { deferred.reject(error); }
                  );
          return deferred.promise;
      };
      //update artist
      updateArtist = function (artist) {
          var deferred = $q.defer();
          var item = {"Title": artist.name, "Genre": artist.genre, "Rating": artist.rating };
          sharepointListService.updateItem("Artists", artist.id, item).then(
                      function (d) {
                          updateArtistList(artist);
                          deferred.resolve();
                      },
                      function (error) { deferred.reject(error); }
                  );
          return deferred.promise;
      };

      getArtist = function (id) {
          var deferred = $q.defer();
          sharepointListService.getItem("Artists", id).then(
                      function (d) {
                          var artist = createArtist(d.data.d);
                          deferred.resolve(artist);
                      },
                      function (error) { deferred.reject(error); }
              );
            return deferred.promise;
      };
      //genre operations
      getGenres = function (callback) {
          var deferred = $q.defer();
          //check if we already have genres
          if (genres != null)
              deferred.resolve(genres);
          else {
              sharepointListService.getItems("Genres", "Title").then(
                      function (d) {
                          genres = [];
                          $(d.data.d.results).each(function (i, e) {
                              genres.push({
                                  id: e["Id"],
                                  genre: e["Title"]
                              });
                          });
                          deferred.resolve(genres);
                      },
                      function (error) { deferred.reject(error); }
              );
          }
          return deferred.promise;
      };
      return {
          getArtists: getArtists,
          addArtist: addArtist,
          updateArtist: updateArtist,
          getArtist : getArtist,
          getGenres: getGenres
      }
  }]);


function musicService($rootScope, sharepointService) {
    
    var getArtist = function (index) {
        return sharepointService.getArtist(index);
    }
    var getGenres = function () {
        return sharepointService.getGenres();
    }
    var getArtists = function () {
        return sharepointService.getArtists();
    }
    var addArtist = function (artist) {
        return sharepointService.addArtist(artist);
    }
    var updateArtist = function (artist) {
        return sharepointService.updateArtist(artist);
    }
    return {
        getGenres: getGenres,
        getArtists: getArtists,
        addArtist: addArtist,
        getArtist: getArtist,
        updateArtist: updateArtist
    }
}

musicApp.factory("musicService", ["$rootScope", "sharepointService", musicService]);

function listCtrl($scope, $location, $routeParams, sharepointConstants, musicService) {
    sharepointConstants.initConstants().then(
        function () {
            musicService.getArtists().then(function (artists) {
                $scope.data = artists;
            });
        },
        function(error){alert(error)});

    $scope.editItem = function (index) {
        $location.path("/Items/edit/" + index);
    }
    $scope.addArtist = function () {
        $location.path("/Items/add");
    }
}

function addCtrl($scope, $location, $routeParams, musicService) {
    
    // $scope.genres = musicService.getGenres();
    musicService.getGenres().then(function (genres) {
        $scope.genres = genres;
    });

    $scope.cancel = function () {
        $location.path("/Items");
    }
    $scope.addArtist = function () {
        var artist = {
            name: $scope.item.name,
            genre: $scope.item.genre,
            rating: $scope.item.rating
        };
        musicService.addArtist(artist).then(function () { $location.path("/Items"); });
    }
}

function editCtrl($scope, $location, $routeParams, musicService, $q) {
    var p1 = musicService.getArtist($routeParams.index);
    var p2 = musicService.getGenres();
    $q.all([p1, p2]).then(function (data) {
        console.log(data[0], data[1]); 
        $scope.item = data[0]; //artist
        $scope.genres = data[1]; //genres
    });
        
    $scope.cancel = function () {
        $location.path("/Items");
    }
    $scope.addArtist = function () {
        // musicService.editArtist($routeParams.index, $scope.item);
        musicService.updateArtist($scope.item).then(function () {
            $location.path("/list");
        }
        );
    }
}

musicApp.controller("listCtrl", ["$scope", "$location", "$routeParams","sharepointConstants", "musicService", listCtrl]);
musicApp.controller("addCtrl", ["$scope", "$location", "$routeParams", "musicService", addCtrl]);
musicApp.controller("editCtrl", ["$scope", "$location", "$routeParams", "musicService","$q", editCtrl]);