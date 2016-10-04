
//////////
// MAIN //
//////////

// standard global variables
var container, scene, camera, renderer, stats;

//JSON data saved here
var json_data;

//CROSSFILTER VARS

 var cf;

 var dimByMonth;

 var groupByMonth;

  var dimByOrg;

  var groupByOrg;


  var dimByRepo;

  var groupByRepo;

 elasticstuff();

// initialization
  //getJSON call, draw meshes with data
   $.getJSON("jsons/scm-commits.json", function(data) {
      json_data=data;
      init();
      // animation loop / game loop
      animate();
   });

///////////////
// FUNCTIONS //
///////////////

function elasticstuff() {
  //elasticsearch and angular
    // App module
    //
    // The app module will contain all of the components the app needs (directives,
    // controllers, services, etc.). Since it will be using the components within
    // the elasticsearch module, define it a dependency.
    var ExampleApp = angular.module('ExampleApp', ['elasticsearch']);

    // Service
    //
    // esFactory() creates a configured client instance. Turn that instance
    // into a service so that it can be required by other parts of the application
    ExampleApp.service('client', function (esFactory) {
      return esFactory({
        host: 'localhost:9200',
        apiVersion: '2.3',
        log: 'trace'
      });
    });

    // Controller
    //
    // It requires the "client" service, and fetches information about the server,
    // it adds either an error or info about the server to $scope.
    //
    // It also requires the esFactory to that it can check for a specific type of
    // error which might come back from the client
    ExampleApp.controller('ExampleController', function ($scope, client, esFactory) {

      client.cluster.state({
        metric: [
          'cluster_name',
          'nodes',
          'master_node',
          'version'
        ]
        })
/*      client.search({
        index:'commits-index',
        body: {
          query: {
            match: {
              _id: 'f2776c6c64b0a84df55edc1542dd6e67420d9076_git://git.opnfv.org/qtip'
            }
          }
        }
      })
*/
      .then(function (resp) {
        $scope.clusterState = resp;
        $scope.error = null;
      })
      .catch(function (err) {
        $scope.clusterState = null;
        $scope.error = err;

        // if the err is a NoConnections error, then the client was not able to
        // connect to elasticsearch. In that case, create a more detailed error
        // message
        if (err instanceof esFactory.errors.NoConnections) {
          $scope.error = new Error('Unable to connect to elasticsearch. ' +
            'Make sure that it is running and listening at http://localhost:9200');
        }
      });

    });
}

function init () {

   ///////////
   // SCENE //
   ///////////
   scene = new THREE.Scene();

   ////////////
   // CAMERA //
   ////////////
   // set the view size in pixels (custom or according to window size)
   var SCREEN_WIDTH = window.innerWidth;
   var SCREEN_HEIGHT = window.innerHeight;
   // camera attributes
   var VIEW_ANGLE = 45;
   var ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT;
   var NEAR = 0.1;
   var FAR = 20000;
      // set up camera
   camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
   // add the camera to the scene
   scene.add(camera);
   // the camera defaults to position (0,0,0)
   //    so pull it back (z = 400) and up (y = 100) and set the angle towards the scene origin
   camera.position.set(0,150,400);
   camera.lookAt(scene.position);

   //////////////
   // RENDERER //
   //////////////
   renderer = new THREE.WebGLRenderer( {antialias:true} );
   renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
   renderer.setClearColor( 0xd8d8d8 );

   // attach div element to variable to contain the renderer
   container = document.getElementById( 'ThreeJS' );
   // attach renderer to the container div
   container.appendChild( renderer.domElement );

    ////////////
  // EVENTS //
  ////////////



  // automatically resize renderer
  THREEx.WindowResize(renderer, camera);
    // toggle full-screen on given key press
  THREEx.FullScreen.bindKey({ charCode : 'm'.charCodeAt(0) });

   ///////////
   // LIGHT //
   ///////////
   var light = new THREE.PointLight(0xffffff,0.8);
   light.position.set(0,200,250);
   scene.add(light);
   var ambientLight = new THREE.AmbientLight(0x111111);
   // scene.add(ambientLight);

   // create a set of coordinate axes to help orient user
   //    specify length in pixels in each direction
   var axes = new THREE.AxisHelper(1000);
   scene.add(axes);

  //STATS
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.bottom = '0px';
  stats.domElement.style.zIndex = 100;
  container.appendChild( stats.domElement );

   //////////////
   // CUSTOM //
   //////////////

   // most objects displayed are a "mesh":
   //  a collection of points ("geometry") and
   //  a set of surface parameters ("material")

  var parsed_data=[];

  // Crossfilter and dc.js format
  json_data.values.forEach(function (value) {
    var record = {}
    json_data.names.forEach(function (name, index) {
        if (name == "date") {
          var date = new Date(value[index]*1000);
          record[name] = date;
          record.month = new Date(date.getFullYear(), date.getMonth(), 1);
          record.hour = date.getUTCHours();
        } else {
          record[name] = value[index];
        }
    });
    parsed_data.push(record);
  });

  cf=crossfilter(parsed_data);
  console.log(parsed_data);

  //create a dimension by month

  dimByMonth= cf.dimension(function(p) {return p.month;});

  groupByMonth= dimByMonth.group();

  //create a dimension by org

  dimByOrg= cf.dimension(function(p) {return p.org;});

  groupByOrg= dimByOrg.group();


  //create a dimension by author

  dimByAuthor= cf.dimension(function(p) {return p.author;});

  groupByAuthor= dimByAuthor.group();



  //create a dimension by repository

  dimByRepo= cf.dimension(function(p) {return p.repo;});

  groupByRepo= dimByRepo.group();


  //data without CF

  var data1= [{key:'monday',value:20},{key:'tuesday',value:80},{key:'friday',value:30}];

  var data2= [{key:'may',value:200},{key:'june',value:100},{key:'july',value:250}];

  //example data for cloud

  function getRandomPoints(numberOfPoints){
    var points=[];
    for (var i = 0; i < numberOfPoints; i++) {

      points[i]={x:Math.random()*100,y:Math.random()*100,z:Math.random()*100};
     // console.log(points[i]);
    };
    return points;
  }

 //CUSTOM DASHBOARD//

  THREEDC.initializer(camera,scene,renderer,container);

  var cloud= THREEDC.pointsCloudChart([0,0,0]);
  cloud.getPoints(getRandomPoints(1000));

 // var bars= THREEDC.barsChart([0,0,0]);
  //bars.group(groupByRepo);



  THREEDC.renderAll();

}

function animate()
{
   requestAnimationFrame( animate );
   render();
   update();
}

function render()
{
   renderer.render( scene, camera );
}

function update()
{
  THREEDC.controls.update();
  stats.update();
}