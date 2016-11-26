function Paths()
{
  var viewBoxWidth, viewBoxHeight, svgHeight, columnWidth, rowHeight, focus, runs, starts, ends;
  var totalColumns = 5;
  var totalRows = Math.ceil(runData.length / totalColumns);
  console.log(totalRows)
  setDimensions();

  function draw(){
    d3.selectAll(".runPath").attr("d", function(a, i){      
      //createGradient(gradientName, dX + "px", dY + "px", "90px");
      var maxY = a.maxY
      var minX = a.minX

      var xScaleFactor = columnWidth / a.diffX
      var yScaleFactor = rowHeight / a.diffY

      var ratio = a.diffX / a.diffY

      if (ratio > .707)
      {
        yScaleFactor = xScaleFactor
      }
      else
      {
        xScaleFactor = yScaleFactor
      }

      a.xScale = xScaleFactor
      a.yScale = yScaleFactor

      if (a.fixedArray.length == 0)
      {
        a.fixedArray = [[0, 0]]
      }
      var svgd = "M " + a.fixedArray.map(function(a) {
        return a[0] * xScaleFactor + ", " + a[1] * yScaleFactor
      }).join(" L ")

      return svgd;
    })

    starts.attr("cx", function(a){ return a.fixedArray[0][0] * a.xScale })
      .attr("cy", function(a){ return a.fixedArray[0][1] * a.yScale })

    ends.attr("cx", function(a){ return a.fixedArray[a.fixedArray.length - 1][0]  * a.xScale })
      .attr("cy", function(a){ return a.fixedArray[a.fixedArray.length - 1][1] * a.yScale  })
  }

  function setDimensions()
  {
    var firstXdiff = runData[0].diffX * 1005
    var firstYdiff = runData[0].diffY * 1005

    //totalColumns = Math.floor(w / 350)
    viewBoxWidth = firstXdiff * (totalColumns + 1);
    viewBoxHeight = (firstXdiff / .707) * (totalRows);
    console.log("Viewbox Ratio: " + viewBoxHeight / viewBoxWidth)
    svgHeight = w * (viewBoxHeight / viewBoxWidth)

    rowHeight = firstXdiff / .707;
    columnWidth = firstXdiff;
    console.log("BoxDimensions: " + columnWidth + "," + rowHeight)
  }

  function setRenderDimensions()
  {
    //TODO: this is probably wrong...
    this.svg.attr('height', svgHeight)
    this.svg.attr('viewBox', "0 0 " + viewBoxWidth + " " + viewBoxHeight)
    
    d3.select(".titleText")
      .attr("x", viewBoxWidth / 2)
      .attr("y", 5)
  }

  this.resize = function()
  {
    setDimensions();
    setRenderDimensions();
    draw();
  }

  this.render = function(svg)
  {
    $('#graph').css("position", "absolute")
    this.svg = svg.on(".zoom", null)
    .append("g")
      .attr("class", 'main');

    var containers = this.svg.selectAll('runContainer')
        .data(runData)
        .enter()
        .append("g")
        .attr('transform', function(a, i){
          var column = i % totalColumns
          var row = Math.floor(i / totalColumns)
          var boxMinX = (column + .25) * columnWidth
          var boxMinY = (row + .25) * rowHeight
          return "translate (" + boxMinX + "," + boxMinY + ")"
        })
        .attr("class", function(d) {return d.pace > targetPace ? "runContainer negative" : "runContainer positive" })
        .attr('stroke-width', 0.2)
        .on('mouseover',function(d){ 
          d3.select(this).classed('active',true)
          d3.select(this).transition().duration(100).attr('stroke-width', 1);
        })
        .on('mouseout',function(d){ 
          d3.select(this).classed('active', false);
          d3.select(this).transition().duration(65).attr('stroke-width', 0.2);
        })
        .on('click', function(d){ 
          displayData(d);
        })

    containers.append('rect')
      .style('visibility', 'hidden')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', columnWidth)
      .attr('height', rowHeight)

    runs = containers.append('path')
        .attr("class", "runPath")
        .attr("fill", "none")
        //.attr('stroke', 'url(#' + gradientName + ')')

    starts = containers.append('circle')
      .attr("r", .5)
      .attr("fill", "none")
      .attr("stroke-width", 0.3)

    ends = containers
      .append('circle')
      .attr("r", .5)
      .attr("stroke-width", 0.3)
      .attr("class", "ends")

    focus = this.svg.append("g")
      .style("display", "none");

    // place the duration at the intersection
    focus.append("text")
        .attr("class", "y3")
        .attr("dx", 5)
        .attr("dy", "-.3em");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("class", "titleText")
        .style("font-size", "4px")
        .text("Paths");

    setRenderDimensions();
  }
}