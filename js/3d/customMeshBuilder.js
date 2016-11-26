CustomMeshBuilderCreateGroundFromHeightMap = function (name, url, options, scene) {
    var width = options.width || 10.0;
    var height = options.height || 10.0;
    var subdivisions = options.subdivisions || 1 | 0;
    var minHeight = options.minHeight || 0.0;
    var maxHeight = options.maxHeight || 10.0;
    var updatable = options.updatable;
    var onReady = options.onReady;
    var ground = new BABYLON.GroundMesh(name, scene);
    ground._setReady(false);
    var onload = function (img) {
        // Getting height map data
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        var bufferWidth = img.width;
        var bufferHeight = img.height;
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
        context.drawImage(img, 0, 0);
        // Create VertexData from map data
        // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
        var buffer = context.getImageData(0, 0, bufferWidth, bufferHeight).data;
        var heightMapOptions = {
            width: width, height: height,
            subdivisions: subdivisions,
            minHeight: minHeight, maxHeight: maxHeight,
            buffer: buffer, bufferWidth: bufferWidth, bufferHeight: bufferHeight
        }

        var vertexData = CustomVertexGroundFromHeightMap(heightMapOptions);
        vertexData.applyToMesh(ground, updatable);
        ground._setReady(true);
        //execute ready callback, if set
        if (onReady) {
            onReady(ground);
        }
    };
    BABYLON.Tools.LoadImage(url, onload, function () { }, scene.database);
    return ground;
};

CustomMeshBuilderCreateTiledGroundFromTerrariumHeightMap = function (name, options, scene)
{
    var xmin = options.xmin || -1.0
    var zmin = options.zmin || -1.0
    var xmax = options.xmax || 1.0
    var zmax = options.zmax || 1.0
    var subdivisions = options.subdivisions || { w: 1, h: 1 }
    var precision = options.precision || { w: 1, h: 1 }
    var zoom = options.mapOptions.zoom
    var xTileBase = options.mapOptions.xTileBase
    var yTileBase = options.mapOptions.yTileBase
    console.log(options)
    subdivisions.h = (subdivisions.h < 1) ? 1 : subdivisions.h;
    subdivisions.w = (subdivisions.w < 1) ? 1 : subdivisions.w;
    precision.w = (precision.w < 1) ? 1 : precision.w;
    precision.h = (precision.h < 1) ? 1 : precision.h;

    var row, col, tileRow, tileCol
    var deferredArray = []
    var tiledGroundMeshes = []

    var tileSize = {
        'w': (xmax - xmin) / subdivisions.w,
        'h': (zmax - zmin) / subdivisions.h
    }

    var groundReflectionTextureMap = "https://dl.dropboxusercontent.com/u/4730088/swiss.jpg"
    var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
    groundMaterial.reflectionTexture = new BABYLON.Texture(groundReflectionTextureMap, scene);
    groundMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SPHERICAL_MODE;
    
    for (tileRow = 0; tileRow < subdivisions.h; tileRow++) {    
        for (tileCol = 0; tileCol < subdivisions.w; tileCol++) {
            var tiledGroundName = name + "-" + tileCol + "-" + tileRow

            var onload = function (vertexData, material) {
                var tiledGround = new BABYLON.Mesh(tiledGroundName, scene)
                
                tiledGround.material = material;
                vertexData.applyToMesh(tiledGround, options.updatable);
                tiledGroundMeshes.push(tiledGround);
            }

            var TiledGroundOptions = 
            {
                "xTileMin": xmin + tileCol * tileSize.w,
                "zTileMin": zmin + tileRow * tileSize.h,
                "xTileMax": xmin + (tileCol + 1) * tileSize.w,
                "zTileMax": zmin + (tileRow + 1) * tileSize.h,
                "tilePath": zoom + "/" + (xTileBase + tileCol) + "/" + (yTileBase - tileRow),
                "heightmapUrl": "https://terrain-preview.mapzen.com/terrarium/",
                "materialUrl": "https://api.mapbox.com/styles/v1/<mapboxId>/<mapboxPathId>/tiles/",
                    //"https://b.tile.openstreetmap.org/",
                    //"http://a.tile.stamen.com/toposm-color-relief/",
                minHeight: options.ymin,
                maxHeight: options.ymax
            }

            CustomVertexTiledGroundFromTerrariumHeightMap(TiledGroundOptions, scene, onload);
        }
    }
    return tiledGroundMeshes;
};