function MileSplitsPaceTrend()
{
  minSplitPace -= minSplitPace % 60;
  maxSplitPace += 60 - (maxSplitPace % 60);

  this.svgxAxis;
  var splitSelected = false;
  var selectedRun = "";
  var xDistanceScaleRound = d3.scale.linear()
            .rangeRound([0,w])
            .domain([1, Math.ceil(maxDistance)+1]),
      y = d3.scale.linear()
            .rangeRound([h,3*h/4,h/4,0])
            .domain(
              [
                minSplitPace,
                360,
                440,
                maxSplitPace
              ])
      yBar = d3.scale.linear()
      xAxis = d3.svg.axis()
              .orient("bottom")
              .tickPadding(6)
              .tickFormat(function(a) { return a; })
              .tickValues(d3.range(1, Math.ceil(maxDistance)+1, 1)),
      yAxis = d3.svg.axis()
              .orient("left")
              .tickSize(-w)
              .tickPadding(6)
              .tickFormat(secondsToString)

  var barWidth = 0;

  setDimensions();
  
  var lineFunc = d3.svg.line()
    .x(function (d) {
      return xDistanceScaleRound(d.x);
    })
    .y(function (d) {
      return y(d.y);
    })
    .interpolate('linear');

  var smoothLine = d3.svg.line()
    .x(function (d) {
      return xDistanceScaleRound(d.x);
    })
    .y(function (d) {
      return y(d.y);
    })
    .interpolate('basis');

  var allRegressions = [];
  var sample = 27;
  var reg = regression('logarithmic', allSplits);
  allRegressions.push(d3.range(1, sample).map(function(d)
  {
    return {
      x: d,
      y: reg.equation[0]+ (reg.equation[1] * Math.log(d))
    };
  }));

  for (i = 1; i < 3; i++)
  {
    reg = regression('polynomial', allSplits, i);
    allRegressions.push(d3.range(1, sample, 0.25).map(function(d){ return {
            x: d, 
            y: polynomialCalculation(reg.equation, d)
            };
        }));
  }
  
  var fake = d3.behavior.zoom();

  function GetRelatedRuns(id)
  {
    var split = id.toString().split(' ');
    return runData.filter(function(a){ return split.indexOf(a.id.toString()) >= 0; })
  }

  function GetTooltipHtml(d)
  {
    var html = "<div class='paceTip'>Pace: <strong>" + secondsToString(Math.floor(d.pace)) + "</strong></div><table class='table table-condensed table-hover'>"
    runs = GetRelatedRuns(d.runIds);
    runs.forEach(function (r){
      html += "<tr class='runTip' id="+ r.id +">";
      html += '<td><a href="'+ stravaUrl + r.id + '">' + r.name + "</a></td><td>" + r.distance.toFixed(2) + " mi. </td><td> " + new Date(r.date).toDateString() + " </td>";
      html += "</tr>";
    })
    return html += "</table>";
  }

  function ClickSplit(d)
  {
    splitSelected = true;
    relatedRuns = GetRelatedRuns(d.runIds);

    var selectionArea = d3.select('.selection');
    selectionArea.append("rect")
              .attr("class", "selectionArea")
              .attr("width", w)
              .attr("height", h)
              .on('click', DeselectSplit);

    var maxSelectedDistance = d3.max(relatedRuns.map(function(r) { return r.splits.length })) + 1;

    relatedRuns.forEach(function (run) {
      var runContainer = selectionArea.append("g")
        .attr("class", "selectedRunContainer")
        .datum(run.id)

      run.splits.forEach(function (split, mile) {
        var container = runContainer.append("g")
          .attr("class", "selectedSplitContainer")

        container.append("rect")
          .attr("class", "selectedRectangles")
          .attr("width", barWidth)
          .attr("y", function() { return y(split.pace) })
          .attr("x", xDistanceScaleRound(mile+1))
          .attr("height", 1)
          .style("opacity", .5)
          .attr("fill", function() { return getHSLANumber(split.pace, y.domain()); })
          .transition().duration(100)
          .attr("height", function() {
            return y.range()[0] - y(split.pace); 
          });

        container.append("text")
          .attr("class", "selectedTimes")
          .attr("font-size", "14px")
          .attr("y", function() { return y(split.pace) + 14 })
          .attr("x", xDistanceScaleRound(mile+1) + barWidth/2)
          .attr("text-anchor", "middle")
          .text(secondsToString(split.pace));
      });
    });

    var tooltip = $('.d3-tip')
    tooltip.css({
      "left": m.left,
      "width": xDistanceScaleRound(maxSelectedDistance),
      "bottom": m.bottom,
      "top": "auto"
    })

    $(".paceTip").remove();
    $(".runTip").first().addClass('selected');
    SortAndShowSelectedRun(relatedRuns[0].id);
    $(".runTip").click(function(r){
      SortAndShowSelectedRun(this["id"]);
      $(".runTip").removeClass("selected");
      $(this).addClass("selected");
    });
  }

  function SortAndShowSelectedRun(id)
  {
    var runContainers = d3.selectAll(".selectedRunContainer");
      var selectedContainer = runContainers.filter(function(a, i) { return a == id; })
      runContainers.style("opacity", .25)
      runContainers.sort(function (a, b) {
          if (a != id) return -1;
          return 1;
      });
      selectedContainer.style("opacity", 1)
  }

  function DeselectSplit()
  {
    if (!splitSelected) return;
    splitSelected = false;
    d3.selectAll(".selectedRectangles").transition().duration(100).attr("height", 0).remove();
    d3.select(".selectionArea").transition().duration(120).attr("height", 0).remove();
    d3.selectAll(".selectedTimes").transition().duration(120).attr("opacity", 0).remove();
    d3.selectAll(".selectedRunContainer").remove();
    tip.hide();

    var tooltip = $('.d3-tip')
    tooltip.css({
      "left": "auto",
      "width": "auto",
      "bottom": "auto",
      "top": "auto"
    })
  }

  var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(GetTooltipHtml)
  
  function setDimensions()
  {
    barWidth = xDistanceScaleRound(1) - xDistanceScaleRound(0);
    xDistanceScaleRound.rangeRound([0,w])
    y.rangeRound([h,3*h/4,h/4,0])
    yBar.rangeRound([h, 0]),
    xAxis.scale(xDistanceScaleRound)
    yAxis.scale(y)
      .tickSize(-w)
      .tickValues(d3.range(Math.floor(y.domain()[0]), Math.floor(y.domain()[2]), 60));
  }
  
  this.resize = function()
  {
    setDimensions();
    setRenderDimensions();
  }
  
  function setRenderDimensions()
  {
    d3.select("#clip rect")
      .attr('width', w)
        .attr('height', h);
    
    d3.select(".x.axis").attr('transform', 'translate(' + barWidth / 2 + ',' + h +')')
      .call(xAxis);
    
    d3.select(".y.axis").call(yAxis);
    
    d3.selectAll(".mile")
      .attr("transform", function(d, k) { return "translate(" + xDistanceScaleRound(k+1) + ",0)"; });
    
    d3.selectAll(".splitRectangle")
      .attr("width", barWidth)
      .attr("y", function(d) { return y(d.pace); })
      .attr("height", function(d) { 
        var height = y(d.pace) - y(d.pace+1);
        return (height > 0) ? height : 1;
      })
    
    d3.selectAll(".regression")
      .attr("d", smoothLine)
    
    d3.select(".titleText")
      .attr("x", (w + m.left + m.right) / 2)
      .attr("y", 10 + (m.top / 2))
  }
  
  this.render = function(svg)
  {
    svg.call(fake);
    this.svg = svg.call(tip).append("g")
        .attr("transform", "translate(" + m.left + "," + m.top + ")")
        .attr("class", 'main');

    svg.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
        .attr('width', w)
        .attr('height', h);
        
    this.svg.append("g")
      .attr('class', 'x axis')
      .attr('transform', 'translate(' + barWidth / 2 + ',' + h +')')
      .call(xAxis);

    this.svg.append("g")
      .attr('class', 'y axis')
      .call(yAxis);

    this.svg.selectAll("path.regression")
      .data(allRegressions)
      .enter()
      .append("svg:path")
      .attr("class", "regression")
      .attr("d", smoothLine)
      .attr("fill", "none")
      .attr('clip-path', 'url(#clip)');

    mileBars = this.svg.selectAll(".mile")
        .data(miles)
      .enter().append("g")
        .attr("class", "mile")
        .attr("transform", function(d, k) { return "translate(" + xDistanceScaleRound(k+1) + ",0)"; });

    mileBars.selectAll("rect")
      .data(function(d) { return d; })
      .enter().append("rect")
      .attr("width", barWidth)
      .attr("y", function(d) { return y(d.pace); })
      .attr("class", "splitRectangle")
      .attr("runIds", function(d) { return d.runIds })
      .on('mouseover',function(d){ 
        if (splitSelected) return;
        tip.show(d);
        var selectedRunIds = d.runIds.split(' ');
        d3.selectAll('.splitRectangle')
          .filter(function(runSplit) {
            var intersection = runSplit.runIds.split(' ').filter(function(runId) {
              return (selectedRunIds.indexOf(runId) != -1);
            })
            return intersection.length > 0;
          }).classed("active", true).transition().duration(100).attr('stroke-width', 3);
      })
      .on('mouseout',function(d){ 
        if (splitSelected) return;
        tip.hide(d);
        d3.selectAll('.splitRectangle').classed("active", false).transition().duration(100).attr('stroke-width', 0);
      })
      .attr("height", function(d) { 
        var height = y(d.pace) - y(d.pace+1);
        return (height > 0) ? height : 1;
      })
      .attr("fill", function(d) { return getHSLANumber(d.pace, y.domain()); })
      .on('click', function(d){
        d3.selectAll('.splitRectangle').classed("active", false).transition().duration(100).attr('stroke-width', 0);
        ClickSplit(d);
      });

    
    
    this.svg.append("g")
      .attr('class', "selection");

    svg.append("text")
        .attr("class", "titleText")
        .attr("x", (w + m.left + m.right) / 2)
        .attr("y", 10 + (m.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "30px")
        .text("Individual Miles vs Pace");
    
    /*var splitLines = svg.selectAll('splitLines')
      .data(runData)
      .enter().append("svg:path")
      .attr("d", function(d){
        return lineFunc(d.splits.map(function(a, n){
          return {x: n+1, y: Math.round(a.time / a.distance) , distance: a.distance};
        }));
      })
      .attr("stroke", function(d) { return getHSLANumber(d.pace, y.domain()); })
      .attr("stroke-width", 1)
      .attr("fill", "none")
      .attr('transform', 'translate(' + barWidth / 2 + ',0)')
      .attr('clip-path', 'url(#clip)')
      .on('mouseover',function(d){ 
          d3.select(this).classed('active',true); 
          d3.select(this).transition().duration(100).attr('stroke-width', 3);
         })
      .on('mouseout',function(d){ d3.select(this).classed('active', false); d3.select(this).transition().duration(100).attr('stroke-width', 1);})
      .on('click', function(d){ displayData(d); });*/
  }
}