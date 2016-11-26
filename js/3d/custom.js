CustomVertexGroundFromHeightMap = function (options) {
    var indices = [];
    var positions = [];
    var normals = [];
    var uvs = [];
    var row, col;
    
    var columnWidth = options.width / options.subdivisions
    var rowHeight = options.height / options.subdivisions
    var widthCorrectionFromCenter = options.width / 2.0
    var heightCorrectionFromCenter = options.height / 2.0
    
    var finalXCorrection = (widthCorrectionFromCenter) + options.xOrigin
    var finalZCorrection = (-1 * heightCorrectionFromCenter) + options.zOrigin

    // Vertices
    for (row = 0; row <= options.subdivisions; row++) {
        for (col = 0; col <= options.subdivisions; col++) {
            var x = (col * columnWidth) - widthCorrectionFromCenter
            var y = 0
            // In reverse
            var z = (options.subdivisions - row) * rowHeight - heightCorrectionFromCenter
            
            var position = new BABYLON.Vector3(x, 0, z);
            // Compute height
            var percentThroughWidth = (position.x + widthCorrectionFromCenter) / options.width
            var percentThroughHeight = (1.0 - (position.z + heightCorrectionFromCenter) / options.height)
            var heightMapXPosition = (percentThroughWidth * (options.bufferWidth - 1)) | 0;
            var heightMapYPosition = (percentThroughHeight * (options.bufferHeight - 1)) | 0;
            var pos = (heightMapXPosition + heightMapYPosition * options.bufferWidth) * 4; //RGBA
            var r = options.buffer[pos];
            var g = options.buffer[pos + 1];
            var b = options.buffer[pos + 2];

            var mapzen = (r * 256 + g + b / 256) - 32768
            var range = 135
            gradient = mapzen / range
            
            position.y = options.minHeight + (options.maxHeight - options.minHeight) * gradient;
            position.x += finalXCorrection
            position.z += finalZCorrection
            // Add  vertex
            positions.push(position.x, position.y, position.z);
            normals.push(0, 0, 0);
            uvs.push(col / options.subdivisions, 1.0 - row / options.subdivisions);
        }
    }
    // Indices
    for (row = 0; row < options.subdivisions; row++) {
        for (col = 0; col < options.subdivisions; col++) {
            indices.push(col + 1 + (row + 1) * (options.subdivisions + 1));
            indices.push(col + 1 + row * (options.subdivisions + 1));
            indices.push(col + row * (options.subdivisions + 1));
            indices.push(col + (row + 1) * (options.subdivisions + 1));
            indices.push(col + 1 + (row + 1) * (options.subdivisions + 1));
            indices.push(col + row * (options.subdivisions + 1));
        }
    }
    // Normals
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    // Result
    var vertexData = new BABYLON.VertexData();
    vertexData.indices = indices;
    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    return vertexData;
};

CustomVertexTiledGroundFromTerrariumHeightMap = function (options, scene, onload) {
    var xTileMin = options.xTileMin
    var zTileMin = options.zTileMin
    var xTileMax = options.xTileMax
    var zTileMax = options.zTileMax
    var heightmapUrl = options.heightmapUrl
    var materialUrl = options.materialUrl
    var tilePath = options.tilePath
    //console.log(options)
    var tileVertexData
    var outerOnload = onload
    var imageReady = function (img) {
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
        var width = xTileMax - xTileMin
        var height = zTileMax - zTileMin
        var heightMapOptions = {
            width: (xTileMax - xTileMin), height: (zTileMax - zTileMin),
            subdivisions: 256,
            minHeight: options.minHeight,
            maxHeight: options.maxHeight,
            buffer: buffer, bufferWidth: bufferWidth, bufferHeight: bufferHeight,
            xOrigin: xTileMin,
            zOrigin: zTileMax
        }
        tileVertexData = CustomVertexGroundFromHeightMap(heightMapOptions);
        var material = new BABYLON.StandardMaterial(
          "material" + tilePath,
          scene
        );
        material.diffuseTexture = new BABYLON.Texture(
          materialUrl + tilePath + "?access_token=<mapboxToken>",
          //materialUrl + tilePath + ".png",
          scene
        );
        material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        material.alpha = 0.6;
        material.specularColor = new BABYLON.Color4(0, 0, 0, 0);
        outerOnload(tileVertexData, material)
    };

    BABYLON.Tools.LoadImage(heightmapUrl + tilePath + ".png", imageReady, function () { }, scene.database);
    
};