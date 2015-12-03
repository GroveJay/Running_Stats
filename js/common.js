var targetPace = 423.664122
var startDate = "15-07-03"
var stravaUrl = "https://www.strava.com/activities/"

var originalData;

function secondsToString (seconds){
  var output = "";
  var hours = Math.floor(seconds / 3600);
  if (hours){
    output += hours+":";
    seconds = seconds - (hours * 3600);
  }
  var minutes = Math.floor(seconds / 60);
  if (minutes < 10 && hours){
    output += "0";
  }
  output += minutes+":";
  seconds = seconds - (minutes * 60);
  if (seconds < 10){
    output += "0";
  }
  output += seconds;
  return output;
}

function mileFormatter (miles)
{
  return miles.toFixed(0) + ' mi' 
}

// http://stackoverflow.com/a/24544067 //
function formatMinutes (d)
{ 
    var hours = Math.floor(d / 3600),
        minutes = Math.floor((d - (hours * 3600)) / 60),
        seconds = d - (hours * 3600) - (minutes * 60);
    var output = "";
    if (seconds) {
      output = seconds + 's';
    }
    if (minutes) {
        output = minutes + 'm ' + output;
    }
    if (hours) {
        output = hours + 'h ' + output;
    }
    return output;
}
// http://stackoverflow.com/a/24544067 //

function getHSLANumber (value, domain)
{
    var diff = domain[1] - domain[0];
    // var distance = domain[1] - value;
  var distance = targetPace - value;
  var upperDiff = domain[1] - targetPace;
  var lowerDiff = targetPace - domain[0];
  /*if (distance > 0)
  {
    var percentDistance = 100 * (distance / (lowerDiff));
    return "hsla(163, " + percentDistance + "%, 55%, 1)";
  }
  else
  {
    var percentDistance = -100 * (distance / (upperDiff));
    return "hsla(348, " + percentDistance + "%, 55%, 1)";
  }
  */
  var percentDistance = 37;
  if ( value <= targetPace) 
  {
    return "hsla(156, " + percentDistance + "%, 55%, 1)";
  }
  else
  {
    return "hsla(1, " + percentDistance + "%, 55%, 1)";
  }
}

function polynomialCalculation(polys, x)
{
  var y = 0;
  for (j = 0; j < polys.length; j++)
  {
    y += polys[j]*Math.pow(x, j);
  }
  return y;
}

function displayData(data){
    $modal.find('.modal-body p').text("");
    $modal.find('.modal-body .table tbody').empty();

    var output = "";
    output += '<tr><td>Distance</td><td>' + data.distance.toFixed(2) + ' mi</td></tr>';
    output += '<tr><td>Duration</td><td>' + secondsToString(data.duration) + '</td></tr>';
    output += '<tr><td>Average Pace</td><td>' + secondsToString(Math.floor(data.pace)) + ' / mi</td></tr>';
    output += '<tr><td>Average Speed</td><td>' + data.speed.toFixed(2) + ' mph</td></tr>';
    
    $modal.find('.modal-body .table tbody').append(output);
    var title = "";
    title += '<h4><a href="' + stravaUrl + data.id + '">' +data.name+"</a> <small>"+new Date(data.date).toDateString()+"</small></h4>"
    
    $modal.find('.modal-title').html(title);
    $modal.splitsData = data.splits;

    if ($modal.splitsData.length > 15)
    {
      $modal.find('.modal-dialog').addClass("modal-lg");
    }
    else
    {
      $modal.find('.modal-dialog').removeClass("modal-lg"); 
    }
    $modal.modal('show');
}

function toggleMenu()
{
	$('.button').toggleClass('close');
	$('.menu').toggleClass('open');
	$('.chapterGroups').toggle();
	$('body').toggleClass('noscroll');
}

var m = {top: 65, right: 30, bottom: 45, left: 60},
    w = 0,
    h = 0;

var parseDate = d3.time.format("%-y-%-m-%-d").parse;

var dataGraphs = {};
var allSplits = [];
var miles = [];

var averagePace = 0;
var maxDistance,
    maxDuration,
    minSplitPace,
    maxSplitPace,
    minPace,
    runData = [],
    selectedData;

var $modal = $('#activityModal');

$modal.on('hide.bs.modal', function(e) {
  d3.selectAll('#modalSvg').remove();
});

$modal.on('shown.bs.modal', function(e) {
  var modalHeight = 175;
  var modalWidth = $(".modal-footer").width()
  var modalSvg = d3.select(".modal-footer").append("svg")
    .attr("width", modalWidth)
    .attr("height", modalHeight)
    .attr("id", "modalSvg")

  var maxSelectedDistance = $modal.splitsData.length;

  var modalX = d3.scale.linear()
          .rangeRound([0,modalWidth])
          .domain([1, Math.ceil(maxSelectedDistance)+1]);
  var modalY = d3.scale.linear()
          .rangeRound([modalHeight,3*modalHeight/4,modalHeight/4,0])
          .domain(
            [
              minSplitPace,
              360,
              440,
              maxSplitPace
            ])

  var modalBarWidth = modalX(1) - modalX(0);

  var selectionArea = modalSvg.append("g")

  var runContainer = selectionArea.append("g")
    .attr("class", "selectedRunContainer")

  $modal.splitsData.forEach(function (split, mile) {
    var container = runContainer.append("g")
      .attr("class", "selectedSplitContainer")

    container.append("rect")
      .attr("class", "selectedRectangles")
      .attr("width", modalBarWidth)
      .attr("y", function() { return modalY(split.pace) })
      .attr("x", modalX(mile+1))
      .attr("height", function() {return modalY.range()[0] - modalY(split.pace); })
      .attr("fill", function() { return getHSLANumber(split.pace, modalY.domain()); })

    container.append("text")
      .attr("class", "selectedTimes")
      .attr("font-size", "14px")
      .attr("y", function() { return modalY(split.pace) + 14 })
      .attr("x", modalX(mile+1) + modalBarWidth/2)
      .attr("text-anchor", "middle")
      .text(secondsToString(split.pace));
  });
})

var svg = d3.select("#graph").append("svg")
setBaseDimensions();

$.getJSON("./js/data.json", function(){}).done(function(data){ 
  data.forEach(function(d){
    d.date = parseDate(d.date);
  })
	originalData = data;

	runData = originalData.filter(function(a){
    return a.date > parseDate(startDate);
  });

  parseData(runData);

  dataGraphs.mile = new MileSplitsPaceTrend();
  dataGraphs.pace = new DistancePaceTrend();
  dataGraphs.trends = new RunTrends();

  toggleMenu();
});

function FilterDisplayData()
{
	runData = originalData.filter(function(a){
    return (a.date > $('#startDate').data("DateTimePicker").date()) &&
			(a.date < $('#endDate').data("DateTimePicker").date())
  });
	parseData(runData);
	
	dataGraphs.mile = new MileSplitsPaceTrend();
  dataGraphs.pace = new DistancePaceTrend();
  dataGraphs.trends = new RunTrends();
}

/*miles.forEach(function(d) {
  d.sort(function(a, b) { return a.pace - b.pace; });
   var y0 = 0;
   d.forEach(function(s) {
    s.y0 = y0;
    s.y1 = y0 += s.count;
   });
   d.forEach(function(s) 
   {
    s.y0 /= y0; s.y1 /= y0; 
   });
});*/

function parseData(runData)
{
  runData = runData.sort(function(a, b){
    return (a.date < b.date) ? -1 : 1 ;
  })
  
  maxDistance = d3.max(runData.map(function(a) { return a.distance; }));
  maxDuration = d3.max(runData.map(function(a){ return a.duration }));

  maxSplitPace = d3.max(runData.map(function(a)
  { 
    return d3.max(a.splits.map(function(a){ return a.time / a.distance }));
  }));

  minPace = d3.min(runData.map(function(a){ return a.pace }))

	miles = []
	allSplits = []
  for (var i = 0; i < maxDistance; i++)
  {
      miles.push([]);
  }

  runData.forEach(function(run)
  {
    run.pace = Math.round(run.pace);
    averagePace += run.pace;
		if (!(run.date instanceof Date))
		{
			run.date = parseDate(run.date);		
		}
  
    run.splits = run.splits.filter(function (s, k){
        return s.distance > 0.4;
    });
    
    var runTime = 0;
    run.splits.forEach(function (s, k)
    {
      runTime += s.time;
      s.totalTime = runTime;
      s.pace = Math.floor(s.time / s.distance)
      var split = miles[k].filter(function (split) { return split.pace === s.pace; });
      if (miles[k].length === 0 || split.length === 0)
      {
          miles[k].push({pace: s.pace, count: 1, runIds: run.id.toString() });
      }
      else
      {
          split[0].count = split[0].count + 1;
          split[0].runIds += (" " + run.id);
      }
      allSplits.push([k+1, s.pace]);
    });
  });

  minSplitPace = d3.min(runData.map(function(a)
  {
    return d3.min(a.splits.map(function(a){ return a.time / a.distance }));
  }));

  averagePace = averagePace / runData.length;
}

d3.select(window).on('resize', resize);

$('#startDate').datetimepicker({
	format: "MM/DD/YYYY",
	maxDate: Date.now(),
	defaultDate: parseDate("15-07-03")
});
$('#endDate').datetimepicker({
		format: "MM/DD/YYYY",
		maxDate: Date.now(),
		defaultDate: Date.now(),
		useCurrent: false //Important! See issue #1075
});
$("#startDate").on("dp.change", function (e) {
		$('#endDate').data("DateTimePicker").minDate(e.date);
});
$("#endDate").on("dp.change", function (e) {
		$('#startDate').data("DateTimePicker").maxDate(e.date);
});

function resize()
{
	setBaseDimensions();
	dataGraphs[selectedData].resize();
}

$('.button').click(function(){
	toggleMenu();
});

$('.dataView').click(function(){
	FilterDisplayData();
	$("#graph svg").empty();
	selectedData = $(this).attr("data");
  dataGraphs[selectedData].render(svg);
  dataGraphs[selectedData].resize();
  toggleMenu();
});

function setBaseDimensions()
{
	w = $('body').width() - m.left - m.right,
  h = $('body').height() - m.top - m.bottom;
  svg.attr("width", w + m.left + m.right)
		.attr("height", h + m.top + m.bottom)
}