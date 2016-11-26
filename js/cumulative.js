function Cumulative()
{
  var YearOverYear = false;

  var years = Array.from(new Set(runData.map(function(r){ return r.date.getFullYear()})))

  var yearlyData = years.map(function(y)
    {
      return runData.filter(function(r)
      {
        return r.date.getFullYear() == y
      })
    })

  var maxCumulativeMileagePerYear = d3.max(yearlyData.map(function(y)
    {
      return y[y.length - 1].cumulativeDistance;
    }));

  var firstDayYear = new Date(years[0],0);
  var lastDayYear = new Date(new Date(years[0]+1,0).setDate((new Date(years[0]+1,0)).getDate() - 1));

  var x = d3.time.scale()

  var y = d3.scale.linear()

  var color = d3.scale.category10()

  var xAxis = d3.svg.axis()
		  .tickFormat(d3.time.format("%b %-d"))
      .tickPadding(6)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .tickFormat(mileFormatter)
      .tickPadding(6)
      .orient("left");

  setDimensions();

  var line = d3.svg.line()
      //.interpolate("basis")
      .x(function(d) {
        return (YearOverYear)? x(d.date) : x(new Date(d.date).setFullYear(years[0]));
      })
      .y(function(d) { 
        return (YearOverYear)? y(d.totalCumulativeDistance) : y(d.cumulativeDistance);
      });
     
  var area = d3.svg.area()
    .x(function(d) {
      return (YearOverYear)? x(d.date) : x(new Date(d.date).setFullYear(years[0]));
    })
    .y0(y(0))
    .y1(function(d) {
      return (YearOverYear)? y(d.totalCumulativeDistance) : y(d.cumulativeDistance);
    });

  function setDimensions()
  {
    x.range([0, w]);
    y.range([h, 0]);

    if (YearOverYear)
    {
      console.log("Changing it up for Year/Year")
      x.domain([runData[0].date, runData[runData.length -1].date])
      y.domain([0,runData[runData.length - 1].totalCumulativeDistance + 10])
    }
    else
    {
      x.domain([firstDayYear, lastDayYear])
      y.domain([0,maxCumulativeMileagePerYear+10])
    }

    xAxis.scale(x)
      .tickSize(-h);
    yAxis.scale(y)
      .tickSize(-w);
  }
  
  function draw()
  {
  	d3.select(".x.axis").transition().call(xAxis);
    d3.select(".y.axis").transition().call(yAxis);
    d3.selectAll(".years .area").transition()
    	.attr("d", line)
    //d3.selectAll(".people text")
    //	.attr("transform", function(d, i) { return "translate(" + x(d.length) + "," + y(d.value) + ")"; })
  }

  function setRenderDimensions()
  {
  	d3.select(".x.axis").attr("transform", "translate(0," + h + ")")

    d3.select(".titleText")
      .attr("x", (w + m.left + m.right) / 2)
      .attr("y", 10 + (m.top / 2))

    d3.selectAll(".pathLabel").transition()
      .attr("x", function (d, i){ return 8; })
      .attr("y", function(d, i){ return 26 * (i + 1) });
  }
  
   this.resize = function()
   {
   	setDimensions()
    setRenderDimensions()
    draw()
   }
   
   this.render = function(svg)
	 {
    this.svg = svg;
    var graph = this.svg.append("g")
      .attr("transform", "translate(" + m.left + "," + m.top + ")");

    graph.append("g")
        .attr("class", "x axis")

    graph.append("g")
        .attr("class", "y axis")
    // DROP SHADOW FROM http://bl.ocks.org/cpbotha/5200394
      // filters go in defs element
      var defs = svg.append("defs");
      
      // create filter with id #drop-shadow
      // height=130% so that the shadow is not clipped
      var filter = defs.append("filter")
          .attr("id", "drop-shadow")
          .attr("height", "130%");

      // SourceAlpha refers to opacity of graphic that this filter will be applied to
      // convolve that with a Gaussian with standard deviation 3 and store result
      // in blur
      filter.append("feGaussianBlur")
          .attr("in", "SourceAlpha")
          .attr("stdDeviation", 3)
          .attr("result", "blur");

      // translate output of Gaussian blur to the right and downwards with 2px
      // store result in offsetBlur
      filter.append("feOffset")
          .attr("in", "blur")
          .attr("dx", 2.5)
          .attr("dy", 2.5)
          .attr("result", "offsetBlur");

      // overlay original SourceGraphic over translated blurred opacity by using
      // feMerge filter. Order of specifying inputs is important!
      var feMerge = filter.append("feMerge");

      feMerge.append("feMergeNode")
          .attr("in", "offsetBlur")
      feMerge.append("feMergeNode")
          .attr("in", "SourceGraphic");

    var years = graph.selectAll(".years")
        .data(yearlyData)
      .enter().append("g")
        .attr("class", "years")

    years.append("path")
        .attr("class", "area")
        .style("stroke", function(d) { return color(d[0].date.getFullYear()); })
        .style("fill", "none")//function(d) { return color(d[0].date.getFullYear()); });
        .style("filter", "url(#drop-shadow)")
        .attr("stroke-width", "2.25px")
        .on('mouseover',function(d){ 
          d3.select(this)
            .transition().duration(65).attr('stroke-width', "5.75px");
//          focus.style("display", null);
        })
        .on('mouseout',function(d){ 
          d3.select(this).classed('active', false)
            .transition().duration(65).attr('stroke-width', "2.25px");
//          focus.style("display", "none");
        })

    years.append("text")
        .attr("class", "pathLabel")
        .style("font-size", "24px")
        .style("fill", function(d) { return color(d[0].date.getFullYear()); })
        .text(function(d) { return d[0].date.getFullYear(); });

    this.svg.append("text")
          .attr("class", "titleText")
          .attr("text-anchor", "middle")
          .style("font-size", "30px")
          .text("Cumulative Mileage")
          .on("click", function(d){
            YearOverYear = !YearOverYear;
            resize();
          });

		setRenderDimensions();
    draw();
   }
}