
//////////
// MAIN //
//////////

// standard global variables
var container, scene, camera, renderer, controls, stats;
//JSON data saved here
var json_data;
//var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();

// custom global variables
var projector, mouse = { x: 0, y: 0 }, INTERSECTED;
var sprite1;
//graphical user interface
var gui;
var parameters;


var canvas1, context1, texture1;
var current_mini_chart1;
var current_mini_chart2;
//displacement of fixed minichart
var dis=60;
var fixed_minicharts=[];

var  extrudeOpts = {curveSegments:300, amount: 8, bevelEnabled: false, bevelSegments: 2, steps: 2, bevelSize: 1, bevelThickness: 1 };

var domEvents;


//CROSSFILTER VARS


   var cf;

   var dimByMonth;

   var groupByMonth;


  var dimByOrg;

  var groupByOrg;

  var scene_objects1=[];

  var scene_objects2=[];


// initialization
  //getJSON call, draw cubes with data
   $.getJSON("jsons/scm-commits.json", function(data) {
      json_data=data;
      init();
      // animation loop / game loop
      animate();
   });

///////////////
// FUNCTIONS //
///////////////

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

   //////////////
   // CONTROLS //
   //////////////

   // move mouse and: left   click to rotate,
   //                 middle click to zoom,
   //                 right  click to pan
   controls = new THREE.OrbitControls( camera, renderer.domElement );

   ///////////
   // LIGHT //
   ///////////
   var light = new THREE.PointLight(0xffffff,1);
   light.position.set(250,250,250);
   scene.add(light);
      var ambientLight = new THREE.AmbientLight(0x111111);
   // scene.add(ambientLight);

   // create a set of coordinate axes to help orient user
   //    specify length in pixels in each direction
   var axes = new THREE.AxisHelper(1000);
   scene.add(axes);

   // note: 4x4 checkboard pattern scaled so that each square is 25 by 25 pixels.
   var floorTexture = new THREE.ImageUtils.loadTexture( 'images/checkerboard.jpg' );
   floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
   floorTexture.repeat.set( 10, 10 );
   // DoubleSide: render texture on both sides of mesh
   var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture, side: THREE.DoubleSide } );
   var floorGeometry = new THREE.PlaneGeometry(1000, 1000, 1, 1);
   var floor = new THREE.Mesh(floorGeometry, floorMaterial);
   floor.position.y = -0.5;
   floor.rotation.x = Math.PI / 2;
  // scene.add(floor);

   var skyBoxGeometry = new THREE.CubeGeometry( 10000, 10000, 10000 );
   // BackSide: render faces from inside of the cube, instead of from outside (default).
   var skyBoxMaterial = new THREE.MeshBasicMaterial( { color: 0x9999ff, side: THREE.BackSide } );
   var skyBox = new THREE.Mesh( skyBoxGeometry, skyBoxMaterial );
   scene.add(skyBox);
   //scene.fog = new THREE.FogExp2( 0x9999ff, 0.00025 );

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
   
   domEvents  = new THREEx.DomEvents(camera, renderer.domElement)


     //by month
  drawBars();


  // initialize object to perform world/screen calculations
  //projector = new THREE.Projector();

  // when the mouse moves, call the given function
  //document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  //document.addEventListener( 'mousedown', onDocumentMouseDown, false );
  /////// draw text on canvas /////////

  // create a canvas element
  canvas1 = document.createElement('canvas');
  context1 = canvas1.getContext('2d');
  context1.font = "Bold 20px Arial";
  context1.fillStyle = "rgba(0,0,0,0.95)";
    context1.fillText('Hello, world!', 0, 20);

  // canvas contents will be used for a texture
  texture1 = new THREE.Texture(canvas1)
  texture1.needsUpdate = true;


  var spriteMaterial = new THREE.SpriteMaterial( { map: texture1, useScreenCoordinates: true } );
  
  sprite1 = new THREE.Sprite( spriteMaterial );
  sprite1.scale.set(200,100,1.0);
  sprite1.position.set( 50, 50, 0 );
  scene.add( sprite1 ); 

  ////////////////////////////////////////


  //////////////////////////////////////////

  //GUI//
  var gui = new dat.GUI();

  parameters =
  {
    reset: function() { clearFilters() }
  };


  gui.add( parameters, 'reset' ).name("Clear filters");

  gui.close();
  //////

}

function drawPie () {

    var valTotal=dimByMonth.top(Infinity).length;
    var pieRadius=50;
    var angPrev=0;
    var angToMove;

   groupByOrg.top(Infinity).forEach(function(p,i) {

      var material = new THREE.MeshPhongMaterial( {color: get_random_color()} );
      // Creats the shape, based on the value and the radius
      var shape = new THREE.Shape();
      var angToMove = (Math.PI*2*(p.value/valTotal));
      shape.moveTo(0,0);
      shape.arc(0,0,pieRadius,angPrev,
                angPrev+angToMove,false);
      shape.lineTo(0,0);
      var nextAng = angPrev + angToMove;

      var geometry = new THREE.ExtrudeGeometry( shape, extrudeOpts );
      var pieobj = new THREE.Mesh( geometry, material );
      pieobj.rotation.set(0,0,0);
      pieobj.position.set(-75,0,0);
      pieobj.name = "Commits:"+p.value+" Org:"+p.key;
      pieobj.info={
        org:p.key,
        commits:p.value
      }
      scene.add(pieobj );

      scene_objects1.push(pieobj);
      angPrev=nextAng;
   });

}

function drawBars () {

   var z=1;
   var y=0;
   var x=1;

   groupByMonth.top(Infinity).forEach(function(p,i) {
      //commit values are normalized to optimal visualization(/10)
      var geometry = new THREE.CubeGeometry( 1, p.value/10, 10);
      y=p.value/10/2;
      var material = new THREE.MeshLambertMaterial( {color: "#0000ff"} );
      var cube = new THREE.Mesh(geometry, material);
      cube.position.set(x, y, z);
      cube.name = "Commits:"+p.value+" "+p.key;
      cube.info={
        month:p.key,
        commits:p.value
      };
      scene_objects2.push(cube);
      scene.add(cube);

      domEvents.addEventListener(cube,'click',function(event) {
        alert(cube.name);
      },false);

      domEvents.addEventListener(cube,'mouseover',function(event) {
        cube.material.color.setHex(0xffff00);
        context1.clearRect(0,0,640,480);
        var message = cube.name;
        var metrics = context1.measureText(message);
        var width = metrics.width;
        context1.fillStyle = "rgba(0,0,0,0.95)"; // black border
        context1.fillRect( 0,0, width+8,20+8);
        context1.fillStyle = "rgba(255,255,255,0.95)"; // white filler
        context1.fillRect( 2,2, width+4,20+4 );
        context1.fillStyle = "rgba(0,0,0,1)"; // text color
        context1.fillText( message, 4,20 );
        sprite1.position.set( cube.position.x,cube.position.y, cube.position.z );
        texture1.needsUpdate = true;
      },false);
      x+=1;
   });
}


function get_random_color() {
  function c() {
    return Math.floor(Math.random()*256).toString(16)
  }
  return "#"+c()+c()+c();
}

function clearFilters () {
  for (var i = 0; i < scene_objects1.length; i++) {
    scene.remove(scene_objects1[i]);
  };

  for (var i = 0; i < scene_objects2.length; i++) {
    scene.remove(scene_objects2[i]);
  };
  dimByMonth.filterAll();
  dimByOrg.filterAll();
  drawBars();
  drawPie();


}

function onDocumentMouseMove( event )
{
  // the following line would stop any other event handler from firing
  // (such as the mouse's TrackballControls)
  // event.preventDefault();

  // update sprite position
  sprite1.position.set( event.clientX, event.clientY - 20, 0 );

  // update the mouse variable
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


function onDocumentMouseDown( event )
{
  // find intersections

  // create a Ray with origin at the mouse position
  //   and direction into the scene (camera direction)
  var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  projector.unprojectVector( vector, camera );
  var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

  // create an array containing all objects in the scene with which the ray intersects
  var intersects = ray.intersectObjects( scene.children );

  // if there is one (or more) intersections
  if ( intersects.length > 0 )
  {
    //create_fixed_chart(intersects[0].object);
    if(intersects[0].object.info.month){
      redraw1(intersects[0].object.info.month);
    }

    if(intersects[0].object.info.org||intersects[0].object.info.org===0){
      redraw2(intersects[0].object.info.org);
    }

  }
}

function redraw1 (argument) {

  console.log(argument);

   dimByMonth.filterAll();

  dimByMonth.filter(argument);

  //POR QUE NO FUNCIONA SI LE APLICO EL FILTRO A DIMBYORG??????

  console.log("Numero commits en ese mes"+dimByMonth.top(Infinity).length);

  for (var i = 0; i < scene_objects1.length; i++) {
  	scene.remove(scene_objects1[i]);
  };

  drawPie();

  //HABRIA QUE LIMPIAR EL FILTRO DESPUES DE REPINTAR?¿?¿?¿

}

function redraw2 (argument) {

  console.log(argument);

  dimByOrg.filterAll();


  dimByOrg.filter(argument);

  //POR QUE NO FUNCIONA SI LE APLICO EL FILTRO A DIMBYORG??????

  console.log("Numero commits en ese mes en esa org"+dimByMonth.top(Infinity).length);

  for (var i = 0; i < scene_objects2.length; i++) {
    scene.remove(scene_objects2[i]);
  };

  drawBars();

  //HABRIA QUE LIMPIAR EL FILTRO DESPUES DE REPINTAR?¿?¿?¿

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
  controls.update();
}
