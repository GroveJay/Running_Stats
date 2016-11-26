function Circles()
{
  var minRadius = 10
  var halfWidth, halfHeight, maxRadius, radiusIncrement, focus, runs;
  var fake = d3.behavior.zoom();
  
  setDimensions();

  var arcGenerator = d3.svg.arc()
    .startAngle(0)
    .endAngle(function (a){
      return MinutesToArcDegrees(Math.floor(a.duration / 60) % 60)
    })
    .innerRadius(function (a, i){
      return minRadius + (i * radiusIncrement)
    })
    .outerRadius(function (a, i){
      return minRadius + ((i+1) * radiusIncrement)
    })

  function drawVisibleItems(visible){
    runs.attr("d", arcGenerator)
    hourPlus.attr("r", function(a){
        return (minRadius + ((a.ordering + .5) * radiusIncrement))
      })
      .attr("stroke-width", radiusIncrement)
    this.svg.select(".main").attr("transform", "translate(" + halfWidth + "," + halfHeight + ")")
  }

  function setDimensions()
  {
    halfWidth = (w + m.left + m.right) / 2
    halfHeight = (h + m.top + m.bottom) / 2
    maxRadius = ((w < h) ? halfWidth : halfHeight) - m.top
  }

  function setRenderDimensions()
  {    
    d3.select(".titleText")
      .attr("x", (w + m.left + m.right) / 2)
      .attr("y", 10 + (m.top / 2))

    radiusIncrement = (maxRadius - minRadius) / runData.length
  }

  this.resize = function()
  {
    setDimensions();
    setRenderDimensions();
    drawVisibleItems(runs);
  }

  this.render = function(svg)
  {
    this.svg = svg.call(fake)
    .append("g")
      .attr("class", 'main');

    hourPlus = this.svg.selectAll('hourRuns')
      .data(runData.map(function(a, i){
        a.ordering = i
        return a
      }).filter(function(a) {
        return a.duration > (60*60)
      }))
      .enter().append('circle')
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("fill", "none")
      .attr("stroke", "#66f")
      .attr("opacity", .33)

    runs = this.svg.selectAll('runs')
        .data(runData)
        .enter().append('path')
        .attr('class', function(d) {return d.pace > targetPace ? "negative runs" : "positive runs" })
        .attr('transform', function(a){
          var startTime = new Date(a.start)
          return "rotate (" + RadiansToDegrees(MinutesToArcDegrees(startTime.getMinutes())) + ")"
        })
        .on('mouseover',function(d){ 
          d3.select(this).classed('active',true)
          d3.select(this).transition().duration(100).attr('stroke-width', 15);
          focus.style("display", null);
        })
        .on('mouseout',function(d){ 
          d3.select(this).classed('active', false);
          d3.select(this).transition().duration(65).attr('stroke-width', 5);
          focus.style("display", "none");
        })
        .on('click', function(d){ 
          console.log(d)
          displayData(d);
        })

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
        .style("font-size", "30px")
        .text("Clocked");

    setRenderDimensions();
  }
}