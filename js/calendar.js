function Calendar()
{
	var cellSize, centeringLeftMargin, yearCount;
	var percent = d3.format(".1%"),
		format = d3.time.format("%Y-%m-%d");

//  var color = d3.scale.category10()
//      .domain(d3.keys(data[0]).filter(function(key) { return key === "name"; }));

	var colorInterpolation = d3.interpolateHsl("rgb(255,237,160)", "rgb(128,0,38)");
	var startYear = runData[0].date.getFullYear();
	var endYear = runData[runData.length - 1].date.getFullYear() + 1
	if (startYear === endYear)
	{
		endYear = startYear + 1
	}
	yearCount = endYear - startYear;
	var runningDays = runData.map(function(d){ return Number(d.date) })

	setDimensions();

	function monthPath(t0) {
		var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
			d0 = t0.getDay(),
			w0 = d3.time.weekOfYear(t0),
			d1 = t1.getDay(),
			w1 = d3.time.weekOfYear(t1);
		return "M" + d0 * cellSize + "," + ((w0 + 1) * cellSize)
			+ "V" + w0 * cellSize + "H" + 7 * cellSize
			+ "V" + w1 * cellSize + "H" + (d1 + 1) * cellSize 
			+ "V" + (w1 + 1) * cellSize + "H" + 0
			+ "V" + (w0 + 1) * cellSize
			+ "Z";
	}

	function setDimensions()
	{
		cellSize = (w + m.left + m.right) / 4 / 8;
		if ((cellSize * 53) > h)
		{
			cellSize = (h / 54)
		}
		centeringLeftMargin = ((w + m.left + m.right) / 2) - (yearCount * cellSize * 4);
	}
  
	function draw()
	{
		d3.selectAll(".month")
			.attr("d", monthPath);
	}

	function setRenderDimensions()
	{
		d3.selectAll(".year")
			.attr("transform", function(d,i){ return "translate(" + (centeringLeftMargin + (cellSize * 8 * i))  + ",0)"})

		d3.selectAll(".yearText")
			.attr("transform", "translate(" + cellSize * 4 + ",-6)")
	  
		d3.selectAll(".dayContainer")
			.attr("transform", "translate(" + cellSize / 2 + ",0)")

		d3.selectAll(".day")
			.attr("width", cellSize)
			.attr("height", cellSize)
			.attr("x", function(d) { return d.getDay() * cellSize; })
			.attr("y", function(d) { return d3.time.weekOfYear(d) * cellSize; })

		d3.select(".titleText")
			.attr("x", (w + m.left + m.right) / 2)
			.attr("y", 10 + (m.top / 2))
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
			.attr("transform", "translate(0," + m.top + ")");

		var years = graph.selectAll("g")
			.data(d3.range(startYear, endYear))
			.enter().append("g")
			.attr("class", "RdYlGn year")

		years.append("text")
			.style("text-anchor", "middle")
			.text(function(d) { return d; })
			.attr("class", "yearText");
		
		var dayContainers = years
			.append("g")
			.attr("class", "dayContainer")

		var rect = dayContainers
			.selectAll(".day")
			.data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
			.enter().append("rect")
			.attr("class", "day")
			.attr("fill", function(d){
				var index = runningDays.indexOf(+d)
				if (index !== -1)
				{
					var runDistance = runData[index].distance / maxDistance
					return colorInterpolation(runDistance)
				}
				else
				{
					return "#FFF"
				}
			})
			.on('mouseover',function(d){ 
	          d3.select(this).classed('active',true)
	        })
	        .on('mouseout',function(d){ 
	          d3.select(this).classed('active', false);
	        })
	        .on('click', function(d){ 
        		var index = runningDays.indexOf(+d)
				if (index !== -1)
				{
					displayData(runData[index])
				}
	        })
			.append("title")
			.text(function(d){
				var index = runningDays.indexOf(+d)
				return (index !== -1) ? mileFormatter(runData[index].distance) : null;
			});

		dayContainers.selectAll(".months")
			.data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
			.enter().append("path")
			.attr("class", "month")

		this.svg.append("text")
	        .attr("class", "titleText")
	        .attr("text-anchor", "middle")
	        .style("font-size", "30px")
	        .text("Activity Calendar");
	/*
	var data = d3.nest()
	.key(function(d) { return d.Date; })
	.rollup(function(d) { return (d[0].Close - d[0].Open) / d[0].Open; })
	.map(csv);

	rect.filter(function(d) { return d in data; })
	.attr("class", function(d) { return "day " + color(data[d]); })
	.select("title")
	.text(function(d) { return d + ": " + percent(data[d]); });
	});*/
    
		setRenderDimensions();
		draw();
   }
}