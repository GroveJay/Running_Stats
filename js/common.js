var targetPace = 416.79389313
var startDate = "16-01-01"
var stravaUrl = "https://www.strava.com/activities/"
var stravaAuthUrl = "https://www.strava.com/oauth/authorize"

var originalData;

var gradientStops = [{
  offset: '0%',
  'stop-color': '#fb0'
}, {
  offset: '25%',
  'stop-color': '#0bf'
}, {
  offset: '50%',
  'stop-color': '#fb0'
}, {
  offset: '75%',
  'stop-color': '#0bf'
}, {
  offset: '100%',
  'stop-color': '#fb0'
}];

function MinutesToArcDegrees(minutes)
{
  return (minutes / 60) * 2 * Math.PI;
}

function RadiansToDegrees(radians)
{
  return (180 * radians) / (Math.PI)
}

// http://stackoverflow.com/a/27790471
function dayNo(date){
  var y = date.getFullYear();
  var m = date.getMonth() + 1;
  var d = date.getDate() + 1;
  return --m*31-(m>1?(1054267675>>m*3-6&7)-(y&3||!(y%25)&&y&15?0:1):0)+d;
}

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

// Not Currently used - Gradients are almost never a good idea
function createGradient(id, x, y, r) {
  var svgNS = svg.namespaceURI;
  var grad = document.createElementNS(svgNS, 'radialGradient');
  grad.setAttribute('id', id);
  grad.setAttribute('cx', x);
  grad.setAttribute('cy', y);
  grad.setAttribute('r', r);
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  for (var i in gradientStops) {
    var attrs = gradientStops[i];
    var stop = document.createElementNS(svgNS, 'stop');
    for (var attr in attrs) {
      if (attrs.hasOwnProperty(attr)) stop.setAttribute(attr, attrs[attr]);
    }
    grad.appendChild(stop);
  }

  var defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(svgNS, 'defs'), svg.firstChild);
  return defs.appendChild(grad);
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

    var fire = '<span class="glyphicon glyphicon-fire" aria-hidden="true"></span>'
    fire = fire + fire + fire
    var star = '<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span>'
    star = star + star + star
    var map = '<i class="fa fa-map-o" aria-hidden="true"></i>'

    var output = "";
    output += '<tr><td>Distance</td><td>' + data.distance.toFixed(2) + ' mi</td></tr>';
    output += '<tr><td>Duration</td><td>' + secondsToString(data.duration) + '</td></tr>';
    output += '<tr><td>Average Pace</td><td>' + secondsToString(Math.floor(data.pace)) + ' / mi</td></tr>';
    output += '<tr><td>Average Speed</td><td>' + data.speed.toFixed(2) + ' mph</td></tr>';
    
    $modal.find('.modal-body .table tbody').append(output);
    var title = "";
    title += '<h4><a href="' + stravaUrl + data.id + '">' +data.name+"</a> <small>"+new Date(data.date).toDateString()+"</small>"
    title += '<a class="pull-right" href="./3d.html#' + data.id + "-" + athleteId + '">' + map + "</a>"
    title += "</h4>"
    
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

  var params = {
    view : selectedData,
    startDate : $('#startDate input')[0].value,
    endDate : $('#endDate input')[0].value,
    athlete : athleteId,
    activityType : activityType
  }

  var query = "?" + $.param(params)
  window.history.replaceState({path:query},'',query);
}

function redirectToStravaAuth(params)
{
  var stravaAuthFullUrl = stravaAuthUrl + "?" + $.param(params)
  console.log("redirecting to: " + stravaAuthFullUrl)
  window.location.replace(stravaAuthFullUrl)
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
    selectedData,
    athleteId,
    activityType;

activityType = "Run"

// http://stackoverflow.com/a/979995 //
var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  } 
  return query_string;
}();

function FilterDisplayData()
{
  activityType = $(".btn-group input[type=radio]:checked").attr('id')
  runData = originalData.filter(function(a){
    return (a.date >= $('#startDate').data("DateTimePicker").date()) &&
      (a.date <= $('#endDate').data("DateTimePicker").date()) &&
      (a.type === activityType)
  });
  if (runData.length === 0)
  {
    alert("No data to show for given activity type and date range!");
  }
  else
  {
    parseData(runData);
  
    dataGraphs.mile = new MileSplitsPaceTrend();
    dataGraphs.pace = new DistancePaceTrend();
    dataGraphs.trends = new RunTrends();
    dataGraphs.circles = new Circles();
    dataGraphs.paths = new Paths();
    dataGraphs.calendar = new Calendar();
    dataGraphs.cumulative = new Cumulative();  
  }
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

  var currentYear = 0;
  var yearCurry = 0;
  var totalCurry = 0;

  runData.forEach(function(run)
  {
    if (run.date.getFullYear() != currentYear)
    {
      currentYear = run.date.getFullYear();
      yearCurry = 0;
    }
    totalCurry += run.distance;
    yearCurry += run.distance;
    run.cumulativeDistance = yearCurry;
    run.totalCumulativeDistance = totalCurry;

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

    if (run.polyline === undefined || run.polyline === null)
    {
      run.polyline = ""
    }
    run.decodedPoly = polyline.decode(run.polyline).map(function(a) { return [a[1], a[0]] })

    var maxY = run.maxY = Math.max(...run.decodedPoly.map(function(a) { return a[1] }))
    var minX = run.minX = Math.min(...run.decodedPoly.map(function(a) { return a[0] }))

    run.maxX = Math.max(...run.decodedPoly.map(function(a) { return a[0] }))
    run.minY = Math.min(...run.decodedPoly.map(function(a) { return a[1] }))
    
    run.diffX = run.maxX - run.minX
    run.diffY = run.maxY - run.minY

    run.fixedArray = run.decodedPoly.map(function(a) {
      return [(a[0] - minX), (maxY - a[1])]
    })
  });

  minSplitPace = d3.min(runData.map(function(a)
  {
    return d3.min(a.splits.map(function(a){ return a.time / a.distance }));
  }));

  averagePace = averagePace / runData.length;
}

function setBaseDimensions()
{
  w = $('body').width() - m.left - m.right,
  h = $('body').height() - m.top - m.bottom;
  svg.attr("width", w + m.left + m.right)
    .attr("height", h + m.top + m.bottom)
}

function resize()
{
  setBaseDimensions();
  if (selectedData !== undefined)
  {
    dataGraphs[selectedData].resize();  
  }
}

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

d3.select(window).on('resize', resize);

var startDatePicker = $('#startDate').datetimepicker({
	format: "MM-DD-YYYY",
	maxDate: Date.now(),
	defaultDate: parseDate(startDate)
});
var endDatePicker = $('#endDate').datetimepicker({
		format: "MM-DD-YYYY",
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

$('.button').click(function(){
	toggleMenu();
});

$('.dataView').click(function(){
	FilterDisplayData();
	$("#graph").empty().css("position", "fixed")
	svg = d3.select("#graph").append("svg")
	selectedData = $(this).attr("data");
  dataGraphs[selectedData].render(svg);
  resize();
  toggleMenu();
});

dataJsonFileName = "data.json"
athleteQuery = QueryString.athlete
if(athleteQuery === undefined || athleteQuery === "")
{
  console.log("athlete query undefined, using default")
  athleteQuery = 3130286
}
athleteId = athleteQuery

dataJsonFileName = athleteQuery + "_" + dataJsonFileName

$.getJSON(dataJsonFileName, function(){}).done(function(data){
  // Code here to handle getting a bum response back
  if (data.response_type == "code")
  {
    redirectToStravaAuth(data)
    return
  }

  $('.button').toggleClass('spinning');
  data.forEach(function(d){
    d.date = parseDate(d.date);
  })
  originalData = data;
  
  startDateQuery = QueryString.startDate
  if (startDateQuery !== undefined)
  {
    parsedStart = new Date(startDateQuery)
    if (parsedStart !== undefined)
    {
      $('#startDate').data("DateTimePicker").date(parsedStart);
    }
  }
  endDateQuery = QueryString.endDate
  if (endDateQuery !== undefined)
  {
    parsedEnd = new Date(endDateQuery)
    if (parsedEnd !== undefined)
    {
      $('#endDate').data("DateTimePicker").date(parsedEnd);
    }
  }

  activityTypeQuery = QueryString.activityType
  if (activityTypeQuery !== undefined)
  {
    $(".btn-group input[type=radio]#" + activityTypeQuery).click()
    activityType = activityTypeQuery
  }

  FilterDisplayData();
  
  var viewQuery = QueryString.view
  if (viewQuery !== undefined)
  {
    var dataViews = $('.dataView')
    var dataViewNames = dataViews.map(function(){ return $(this).attr("data") })
    if ($.inArray(viewQuery, dataViewNames) !== -1)
    {
      console.log("Found that there is a data view")
      $('.dataView').filter(function(){return $(this).attr("data") == viewQuery}).click();
    }
    else
    {
      console.log("No data view with that name")
    }
  }
  toggleMenu();    
});