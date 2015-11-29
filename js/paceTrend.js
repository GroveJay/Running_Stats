function RunTrends()
{
	var thirdH = (h / 3);

	var bisectDate = d3.bisector(function(d) { return d.date; }).left;

	var d3graphs = {};
	d3graphs.duration = {};
	d3graphs.distance = {};
	d3graphs.pace = {};

	var x = d3.time.scale()
			.range([0,w])
			.domain(d3.extent(runData.map(function(a){ return a.date }))),
		xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.tickSize(-h)
			.tickPadding(6)
			.tickFormat(d3.time.format("%b %-d"));

	var zoom = d3.behavior.zoom()
		.x(x)
		.scaleExtent([1,100])
		.on("zoom", zoomed);

	var lastXPos = 0;

	d3graphs.duration.formatter = secondsToString;
	d3graphs.distance.formatter = mileFormatter;
	d3graphs.pace.formatter = secondsToString;

	for (var graph in d3graphs)
	{
		d3graphs[graph].yscale = d3.scale.linear().range([thirdH, 0])
		d3graphs[graph].yaxis = d3.svg.axis()
			.orient("left")
			.tickPadding(6)
			.tickFormat(d3graphs[graph].formatter)

		d3graphs[graph].line = d3.svg.line()
			.x(function (d) {
				return x(d.date);
			})
			.y(function (d) {
				return d3graphs[graph].yscale(d[graph])
			})
			.interpolate('linear');
	}

	setDimensions();

	d3graphs.duration.yscale.domain([0, maxDuration + 300]),
	d3graphs.distance.yscale.domain([0, maxDistance + 1]),
	d3graphs.pace.yscale.domain([minPace-15, d3.max(runData.map(function(a){ return a.pace })) + 15]),

	d3graphs.duration.yaxis.tickValues(d3.range(1200, d3.max(runData.map(function(a){ return a.duration })) + 300, 1200))
	d3graphs.distance.yaxis.tickValues(d3.range(2, d3.max(runData.map(function(a){ return a.distance })), 2))
	//d3graphs.pace.yaxis.tickValues(d3.range(minPace - (minPace % 30), d3.max(runData.map(function(a){ return a.pace })), 30))

	function drawVisibleItems()
	{
		d3.select("g.x.axis").call(xAxis).selectAll(".tick text").style("text-anchor", "start");
		for (graph in d3graphs)
		{
			d3graphs[graph].svg.select("g.y.axis").call(d3graphs[graph].yaxis)
			d3graphs[graph].path.attr("d", d3graphs[graph].line(runData));
		}
	}

	function zoomed(){
		var t = zoom.translate(),
			s = zoom.scale()

		tx = Math.min(0, Math.max(w * (1-s), t[0]));
		ty = Math.min(0, Math.max(h * (1-s), t[1]));

		zoom.translate([tx, ty]);

		drawVisibleItems()
		mousemove();
	}

	function mousemove() {
		var xPos = (this === window) ? lastXPos : d3.mouse(this)[0],
			x0 = x.invert(xPos),
			i = bisectDate(runData, x0, 1),
			d0 = runData[i - 1],
			d1 = runData[i],
			d = x0 - d0.date > d1.date - x0 ? d1 : d0;

		lastXPos = xPos

		for (var graph in d3graphs)
		{
			d3graphs[graph].focus.attr("transform", "translate(" + x(d.date) + "," + d3graphs[graph].yscale(d[graph]) + ")");
			var text = d3graphs[graph].focus.select("text");
			text.text(d3graphs[graph].formatter(d[graph]));
		}
	}
	
	function setDimensions()
	{
		thirdH = (h / 3);

		x.range([0,w]);
		xAxis.scale(x)
		  .tickSize(-h)

		for (var graph in d3graphs)
		{
			d3graphs[graph].yscale.range([thirdH, 0])
			d3graphs[graph].yaxis
				.tickSize(-w)
				.scale(d3graphs[graph].yscale)
		}
	}

	function setRenderDimensions()
	{
		for (var graph in d3graphs)
		{
			d3graphs[graph].svg.select("#clip-rect")
			  .attr('width', w)
			  .attr('height', thirdH);
		}

		d3.select(".x.axis").attr("transform", "translate(" + m.left + "," + (h + m.top) + ")")
		d3graphs.distance.svg.attr("transform", "translate(" + m.left + "," + (m.top + thirdH) + ")")
		d3graphs.pace.svg.attr("transform", "translate(" + m.left + "," + (m.top + thirdH*2) + ")")

		d3.select(".titleText")
			.attr("x", (w + m.left + m.right) / 2)
			.attr("y", 10 + (m.top / 2))

		d3.select(".overlay")
			.attr("width", w)
			.attr("height", h)
	}

	this.resize = function()
	{
		setDimensions();
		setRenderDimensions();
		zoomed();
	}

	this.render = function(svg)
	{
		this.svg = 	svg.call(zoom);

		this.svg
			.append("g")
			.attr('class', 'x axis')

		for (graph in d3graphs)
		{
			d3graphs[graph].svg = this.svg.append("g");
			
			d3graphs[graph].svg
				.attr("class", 'main ' + graph)
				.append('defs').append('clipPath')
				.attr('id', 'clip' + graph)
				.append('rect')
				.attr('id', 'clip-rect')

			d3graphs[graph].svg
				.append("g")
				.attr('class', 'y axis ' + graph)

			d3graphs[graph].path = d3graphs[graph].svg.append("svg:path")
				.attr('clip-path', 'url(#clip' + graph + ")")
				.attr("stroke-width", 1.5)
				.attr("fill", "none");
			
			var title = graph.charAt(0).toUpperCase() + graph.slice(1);
			
			d3graphs[graph].svg.append("text")
		        .attr("x", 5)
		        .attr("y", 0 + (m.top / 3))
		        .attr("text-anchor", "left")
		        .style("font-size", "20px")
		        .text(title);

		    d3graphs[graph].focus = d3graphs[graph].svg.append("g")
				.attr("class", "focus")
				.style("display", "none");

			d3graphs[graph].focus.append("circle")
				.attr("r", 4.5);

			d3graphs[graph].focus.append("text")
				.attr("y", -14)
				.attr("dy", ".35em");
		}

		d3graphs.duration.svg.attr("transform", "translate(" + m.left + "," + m.top + ")")
		
		svg.append("text")
	        .attr("class", "titleText")
	        .attr("text-anchor", "middle")  
	        .style("font-size", "30px") 
	        .text("Duration, Distance, and Pace Trends over Time");

        svg.append("rect")
			.attr("class", "overlay")
			.attr("transform", "translate(" + m.left + "," + m.top + ")")
			.on("mouseover", function() { for (var graph in d3graphs)
				{
					d3graphs[graph].focus.style("display", null);
				}
			})
			.on("mouseout", function() { for (var graph in d3graphs)
				{
					d3graphs[graph].focus.style("display", "none");
				}
			})
			.on("mousemove", mousemove)
			.on('click', function(){
				var x0 = x.invert(d3.mouse(this)[0]),
					i = bisectDate(runData, x0, 1),
					d0 = runData[i - 1],
					d1 = runData[i],
					d = x0 - d0.date > d1.date - x0 ? d1 : d0;
				displayData(d); 
			})

		setRenderDimensions();
		zoomed();
	}
}