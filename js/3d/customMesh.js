CustomMeshCreateGroundFromTerrariumHeightMap = function (name, url, width, height, subdivisions, minHeight, maxHeight, scene, updatable, onReady) {
    var options = {
        width: width,
        height: height,
        subdivisions: subdivisions,
        minHeight: minHeight,
        maxHeight: maxHeight,
        updatable: updatable,
        onReady: onReady
    };
    return CustomMeshBuilderCreateGroundFromHeightMap(name, url, options, scene);
};

CustomMeshCreateTiledGroundFromTerrariumHeightMap = function (name, xmin, zmin, ymin, xmax, zmax, ymax, tileDivisions, subdivisions, mapOptions, scene, updatable) {
    var options = {
        xmin: xmin,
        zmin: zmin,
        xmax: xmax,
        zmax: zmax,
        ymin: ymin,
        ymax: ymax,
        tileDivisions: tileDivisions,
        subdivisions: subdivisions,
        updatable: updatable,
        mapOptions: mapOptions
    };
    return CustomMeshBuilderCreateTiledGroundFromTerrariumHeightMap(name, options, scene);
};