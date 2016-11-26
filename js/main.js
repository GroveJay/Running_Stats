function DistancePaceTrend()
{
  var xDistanceScale = d3.scale.linear()
          .range([0,w])
          .domain([0, maxDistance + 0.75]),
    y = d3.scale.linear()
          .range([h,0])
          .domain([0, maxDuration + 60]),
    xAxis = d3.svg.axis()
            .orient("bottom")
            .tickPadding(6)
            .tickFormat(function(a) {return a + " mi"}),
    yAxis = d3.svg.axis()
            .orient("left")
            .tickPadding(6)
            .tickFormat(secondsToString)

  setDimensions();

  var zoom = d3.behavior.zoom()
    .x(xDistanceScale)
    .y(y)
    .scaleExtent([1,100])
    .on("zoom", zoomed);

  var paceLine

  var runs

  var focus

  function drawVisibleItems(visible){
    this.svg.select("g.x.axis").call(xAxis).selectAll(".tick text").style("text-anchor", "start");
    this.svg.select("g.y.axis").call(yAxis)

    runs.attr("display", "none");
    visible.attr("display", "block")
    	.attr('cx', function(d) { return xDistanceScale(d.distance) })
      .attr('cy', function(d) { return y(d.duration) })
      .attr('r', 5)
    
    paceLine.attr('x1', 0)
      .attr('x2', w)
      .attr('y1', y(xDistanceScale.domain()[0] * targetPace))
      .attr('y2', y(xDistanceScale.domain()[1] * targetPace))
  }

  function zoomed(){
  	var t = zoom.translate(),
      s = zoom.scale()

    tx = Math.min(0, Math.max(w * (1-s), t[0]));
  	ty = Math.min(0, Math.max(h * (1-s), t[1]));

  	zoom.translate([tx, ty]);
  	drawVisibleItems(getVisible(xDistanceScale.domain(), y.domain()))
  }

  function getVisible(domainX, domainY){
    return runs.filter(function(a){
      return ((a.distance >= domainX[0]-1) &&
          (a.distance <= domainX[1]+1) &&
          (a.duration >= domainY[0]-60) &&
          (a.duration <= domainY[1]+60))
      }
    )
  }

  function setDimensions()
  {
    xDistanceScale.range([0,w]);
    y.range([h,0]);
    xAxis.scale(xDistanceScale)
      .tickSize(-h)
    yAxis.scale(y)
      .tickSize(-w)
      .tickValues(function()
        {
          var tickSize = 600;
          if ((y.domain()[1] - y.domain()[0]) < 3000)
          {
            tickSize = 300;
          }
          var tickDistance = y.domain()[0] % tickSize;
          var min = y.domain()[0] + (tickSize - tickDistance);
          return d3.range(min, y.domain()[1], tickSize)
        });
  }

  function moveLines(d) {
    focus.select("text.y1")
        .attr("transform",
              "translate(" + xDistanceScale(d.distance) + "," +
                             h + ")")
        .text(d.distance.toFixed(2) + ' mi');

    focus.select("text.y2")
        .attr("transform",
              "translate(" + xDistanceScale(d.distance) + "," +
                             y(d.duration) + ")")
        .text(new Date(d.date).toDateString());

    focus.select("text.y3")
        .attr("transform",
              "translate( 0 ," +
                             y(d.duration) + ")")
        .text(secondsToString(d.duration));

    focus.select(".x")
        .attr("transform",
              "translate(" + xDistanceScale(d.distance) + "," +
                             y(d.duration) + ")")
                   .attr("y2", h - y(d.duration));

    focus.select(".y")
        .attr("transform",
              "translate( 0 ," +
                             y(d.duration) + ")")
                   .attr("x2", xDistanceScale(d.distance));
  }

  function setRenderDimensions()
  {
    d3.select("#clip rect")
      .attr('width', w)
      .attr('height', h);
    
    d3.select(".x.axis").attr('transform', 'translate(0,' + h +')')
    
    d3.select(".titleText")
      .attr("x", (w + m.left + m.right) / 2)
      .attr("y", 10 + (m.top / 2))
  }

  this.resize = function()
  {
    setDimensions();
    setRenderDimensions();
    drawVisibleItems(getVisible(xDistanceScale.domain(), y.domain()));
  }

  this.render = function(svg)
  {  
    this.svg = svg.call(zoom)
    .append("g")
      .attr("transform", "translate(" + m.left + "," + m.top + ")")
      .attr("class", 'main');

    this.svg.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
        
    this.svg.append("g")
      .attr('class', 'x axis')
      .call(xAxis)

    this.svg.append("g")
      .attr('class', 'y axis')
      .call(yAxis);

    runs = this.svg.selectAll('runs')
        .data(runData)
        .enter().append('circle')
        .attr('clip-path', 'url(#clip)')
        .attr('class', function(d) {return d.pace > targetPace ? "negative runs" : "positive runs" })
        .attr('r', 5)
        .on('mouseover',function(d){ 
          d3.select(this).classed('active',true)
          d3.select(this).transition().duration(100).attr('r', 15);
          focus.style("display", null);
          moveLines(d);
        })
        .on('mouseout',function(d){ 
          d3.select(this).classed('active', false);
          d3.select(this).transition().duration(65).attr('r', 5);
          focus.style("display", "none");
        })
        .on('click', function(d){ 
          displayData(d);
        })

    paceLine = this.svg.append('line')
      .attr('clip-path', 'url(#clip)')
      .attr("class", "pace")
      .attr("display", "block")

    focus = this.svg.append("g") 
      .style("display", "none");

    // append the x line
    focus.append("line")
        .attr("class", "x")
        .style("stroke", "red")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("y1", 0)

    // append the y line
    focus.append("line")
        .attr("class", "y")
        .style("stroke", "blue")
        .style("stroke-dasharray", "3,3")
        .style("opacity", 0.5)
        .attr("x1", 0)

    // place the value at the intersection
    focus.append("text")
        .attr("class", "y1")
        .attr("dx", 5)
        .attr("dy", "-.3em");

    // place the date at the intersection
    focus.append("text")
        .attr("class", "y2")
        .attr("dx", 5)
        .attr("dy", "-.3em");

    // place the duration at the intersection
    focus.append("text")
        .attr("class", "y3")
        .attr("dx", 5)
        .attr("dy", "-.3em");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("class", "titleText")
        .style("font-size", "30px")
        .text("Run Distance vs Duration");

    setRenderDimensions();
    zoomed();
  }
}