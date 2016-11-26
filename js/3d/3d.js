/* http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#ECMAScript_.28JavaScript.2FActionScript.2C_etc..29 */
function long2tile(lon,zoom) {
  return (Math.floor((lon+180)/360*Math.pow(2,zoom)));
}

function lat2tile(lat,zoom) {
  return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
}

function tile2long(x,z) {
  return (x/Math.pow(2,z)*360-180);
}

function tile2lat(y,z)
{
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

function distance(lat1, lon1, lat2, lon2) {
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
}

var createScene = function() {
  var scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3(.7, .7, .7);

  var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
  light.diffuse = new BABYLON.Color3(1, 1, 1);

  var camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, 0, 0, BABYLON.Vector3.Zero(), scene);
  camera.upperBetaLimit = Math.PI / 2;
	camera.lowerBetaLimit = 0;
  //camera.upperBetaLimit = (Math.PI / 2) * 0.9;
  camera.lowerRadiusLimit = 6.5;
  camera.upperRadiusLimit = 30;
  camera.attachControl(canvas, true);

  // materila
  var mat = new BABYLON.StandardMaterial("StravaMat", scene);
  mat.alpha = 1.0;
  mat.backFaceCulling = false;
  mat.diffuseColor = BABYLON.Color3.FromHexString("#fc4c02");

  // sick ass multi-material
  var multi = new BABYLON.MultiMaterial("nuggetman", scene);
  var minGrade = d3.min(grade_smooth);
	minGrade = -30;
  var maxGrade = d3.max(grade_smooth);
  maxGrade = 30;
  var gradeLevels = maxGrade - minGrade;
	
  var colorInterpolationPos = d3.interpolateHsl("rgb(247,247,247)", "rgb(103,0,31)");
	var colorInterpolationNeg = d3.interpolateHsl("rgb(247,247,247)", "rgb(49,54,149)");
  
  var physicalTileSize = (tileRange.width > tileRange.height) ? 30 / tileRange.width : 30 / tileRange.height 

  var height = grade_smooth.length - 1;
  var width = 1;

  var path = []
  var base = []

  var positions = [];
  var colors = [];
  var indicesFront = [];
  var normalsFront = [];
  var indicesBack = [];
  var normalsBack = [];

  console.log("Grademin/max: " + minGrade + " " + maxGrade)
  console.log("GradeLevels: " + gradeLevels)
  for (i = 0; i < grade_smooth.length; i++)
  {
		var gradeRange = gradeLevels / 2
		var absoluteGrade = Math.abs(grade_smooth[i]) / gradeRange
		var interpolatedColor;
		if (grade_smooth[i] > 0)
		{
			interpolatedColor = colorInterpolationPos(absoluteGrade)
		}
		else
		{
			interpolatedColor = colorInterpolationNeg(absoluteGrade)
		}
    var color = d3.rgb(interpolatedColor);
    colors.push(color.r/256, color.g/256, color.b/256, 1);
    colors.push(color.r/256, color.g/256, color.b/256, 1);
    colors.push(color.r/256, color.g/256, color.b/256, 1);
    colors.push(color.r/256, color.g/256, color.b/256, 1);

    var altLat = (latlng[i][0] - tileRange.southEdge) * tileRange.latTileScale
    altLat -=  tileRange.latTileScale * tileRange.latDiff / 2
    var altLong = (tileRange.eastEdge - latlng[i][1]) * -tileRange.longTileScale
    altLong += tileRange.longTileScale * tileRange.longDiff / 2
    var altHeight = (altitude[i] - tileRange.ymin) * tileRange.altScale + 0.04
    var baseHeight = altHeight - 0.05

    positions.push(altLong, baseHeight, altLat);
    positions.push(altLong, altHeight, altLat);

    if(i != 0)
    {
      var indicesStart = (positions.length / 3) - 4

      indicesFront.push(indicesStart + 2, indicesStart + 1, indicesStart);
      indicesFront.push(indicesStart + 1, indicesStart + 2, indicesStart + 3);

      indicesBack.push(indicesStart, indicesStart + 1, indicesStart + 3);
      indicesBack.push(indicesStart + 3, indicesStart + 2 , indicesStart);

      if (i != (grade_smooth.length - 1))
      {
        positions.push(altLong, baseHeight, altLat);
        positions.push(altLong, altHeight, altLat);
      }
    }
  }

  BABYLON.VertexData.ComputeNormals(positions, indicesFront, normalsFront);
  BABYLON.VertexData.ComputeNormals(positions, indicesBack, normalsBack);

  var vertexDataFront = new BABYLON.VertexData();
  vertexDataFront.positions = positions;
  vertexDataFront.indices = indicesFront;
  vertexDataFront.normals = normalsFront;
  vertexDataFront.colors = colors;

  var vertexDataBack = new BABYLON.VertexData();
  vertexDataBack.positions = positions;
  vertexDataBack.indices = indicesBack;
  vertexDataBack.normals = normalsBack;
  vertexDataBack.colors = colors;

  var blankmeshFront = new BABYLON.Mesh("blankFront", scene);
  var blankmeshBack = new BABYLON.Mesh("blankBack", scene);

  vertexDataFront.applyToMesh(blankmeshFront, true);
  vertexDataBack.applyToMesh(blankmeshBack, true);
  
  var xmin = -(tileRange.width*physicalTileSize/2);
  var zmin = -(tileRange.height*physicalTileSize/2);
  var xmax = -xmin;
  var zmax = -zmin;
  var subdivisions = {
    "w": tileRange.width,
    "h": tileRange.height
  };
  var tileDivisions = {
    'h': 3,
    'w': 3
  };
  var mapOptions = 
  {
    'zoom': tileRange.zoom,
    'xTileBase': tileRange.left,
    'yTileBase': tileRange.bottom
  }

  console.log(tileRange)

  // Create the Tiled Ground
  var tiledGround = CustomMeshCreateTiledGroundFromTerrariumHeightMap ("Tiled Ground", xmin, zmin, tileRange.ymin, xmax, zmax, tileRange.ymax, tileDivisions, subdivisions, mapOptions, scene, false)
  var gridMaterial = new BABYLON.GridMaterial("grid", scene);
  var gridScale = (tileRange.latTileScale / tileRange.height)
  console.log(gridScale);
	gridMaterial.backFaceCulling = false;
  gridMaterial.gridRatio = tileRange.distanceToRenderDimensionScaleInMeters * 1000;
  
  var gridGround = BABYLON.Mesh.CreateGround("gridGround", tileRange.width * physicalTileSize , tileRange.height * physicalTileSize, 1 , scene, false);
  gridGround.material = gridMaterial;
	
  /*
  // Create Multi Material
  var multimat = new BABYLON.MultiMaterial("multi", scene);
  var zoom = 12;
  var xTileBase = 655;
  var yTileBase = 1429;
  for (var row = 0; row < subdivisions.h; row++) {
    for (var col = 0; col < subdivisions.w; col++) {
      var material = new BABYLON.StandardMaterial(
        "material" + row + "-" + col,
        scene
      );
      material.bumpTexture = new BABYLON.Texture(
        "https://terrain-preview.mapzen.com/normal/" + zoom + "/" + (xTileBase + col) + "/" + (yTileBase - row) + ".png",
        scene
      );

      material.reflectionTexture = new BABYLON.Texture(groundReflectionTextureMap, scene);
      material.reflectionTexture.coordinatesMode = BABYLON.Texture.SPHERICAL_MODE;

      //material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
      //material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
      //material.specularColor = new BABYLON.Color4(0, 0, 0, 0);
      material.backFaceCulling = false;
      multimat.subMaterials.push(material);
    }
  }

  // Part 3 : Apply the multi material
  // Define multimat as material of the tiled ground
  tiledGround.material = multimat;

  // Needed variables to set subMeshes
  var verticesCount = tiledGround.getTotalVertices();
  var tileIndicesLength = tiledGround.getIndices().length / (subdivisions.w * subdivisions.h);

  // Set subMeshes of the tiled ground
  tiledGround.subMeshes = [];
  var index = 0;
  var base = 0;
  for (var row = 0; row < subdivisions.h; row++) {
    for (var col = 0; col < subdivisions.w; col++) {
      var submesh = new BABYLON.SubMesh(index++, 0, verticesCount, base, tileIndicesLength, tiledGround);
      //tiledGround.subMeshes.push(submesh);
      base += tileIndicesLength;
    }
  }*/

  return scene;
}

var canvas = document.getElementById('renderCanvas');
var engine = new BABYLON.Engine(canvas, true);
var outerData;
var tileRange = {};
var grade_smooth,latlng,altitude,grade_smooth;

var hash = window.location.hash.substr(1);
var activityId = (hash === "") ? 747210345 : hash;
var activityJson = "./" + activityId + ".json"

$.getJSON(activityJson, function(){}).done(function(jsonData){ 
  data = jsonData;
  grade_smooth = data["grade_smooth"];
  latlng = data["latlng"];
  altitude = data["altitude"];
  grade_smooth = data["grade_smooth"]

  var north_edge = d3.max(latlng, function(l){ return l[0] })
  var south_edge = d3.min(latlng, function(l){ return l[0] })
  var east_edge = d3.max(latlng, function(l){ return l[1] })
  var west_edge = d3.min(latlng, function(l){ return l[1] })

  var zoom        = 15;
  tileRange.top     = lat2tile(north_edge, zoom);
  tileRange.left    = long2tile(west_edge, zoom);
  tileRange.bottom  = lat2tile(south_edge, zoom);
  tileRange.right   = long2tile(east_edge, zoom);
  tileRange.width   = Math.abs(tileRange.left - tileRange.right) + 1;
  tileRange.height  = Math.abs(tileRange.top - tileRange.bottom) + 1;

  tileRange.northEdge = tile2lat(tileRange.top, zoom)
  tileRange.westEdge  = tile2long(tileRange.left, zoom)
  tileRange.eastEdge  = tile2long(tileRange.right + 1 ,zoom)
  tileRange.southEdge = tile2lat(tileRange.bottom + 1 ,zoom)

  var RenderDimension = 30
  var lat1, lon1, lat2, lon2;
  if (tileRange.width > tileRange.height)
  {
    lat1 = tileRange.northEdge
    lon1 = tileRange.westEdge
    lat2 = tileRange.northEdge
    lon2 = tileRange.eastEdge
  }
  else
  {
    lat1 = tileRange.northEdge
    lon1 = tileRange.westEdge
    lat2 = tileRange.southEdge
    lon2 = tileRange.westEdge
  }
  tileRange.longDistanceinMeters = distance(lat1, lon1, lat2, lon2) * 1000
  tileRange.distanceToRenderDimensionScaleInMeters = RenderDimension / tileRange.longDistanceinMeters

  var tileScale = (tileRange.width > tileRange.height) ? RenderDimension / tileRange.width : RenderDimension / tileRange.height
  tileRange.latTileScale = tileScale * tileRange.height
  tileRange.longTileScale = tileScale * tileRange.width
  //var maxGrade = d3.max(grade_smooth)
  //var minGrade = d3.min(grade_smooth)
  //var gradeRange = maxGrade - minGrade
  var lat = latlng.map(function(l){ return l[0]})
  var long = latlng.map(function(l){ return l[1]})
  var maxAlt = d3.max(altitude)
  var minAlt = d3.min(altitude)
  var altDiff = maxAlt

  console.log(tileRange.distanceToRenderDimensionScaleInMeters)
  tileRange.longDiff = tileRange.eastEdge - tileRange.westEdge
  tileRange.latDiff = tileRange.northEdge - tileRange.southEdge
  tileRange.latTileScale = tileRange.latTileScale / tileRange.latDiff
  tileRange.longTileScale = tileRange.longTileScale / tileRange.longDiff

  var highestPoint = 135
  var lowestPoint = 0
  tileRange.ymin = lowestPoint * tileRange.distanceToRenderDimensionScaleInMeters
  tileRange.ymax = tileRange.distanceToRenderDimensionScaleInMeters * highestPoint
  var yScale = tileRange.ymax - tileRange.ymin
  tileRange.altScale = yScale / (highestPoint - lowestPoint)

  tileRange.zoom = zoom;

  // call the createScene function
  var scene = createScene();

  // run the render loop
  engine.runRenderLoop(function() {
    scene.render();
  });

  // the canvas/window resize event handler
  window.addEventListener('resize', function() {
    engine.resize();
  });
});