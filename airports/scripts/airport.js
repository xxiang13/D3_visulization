// Global variables and objects (from bar6.js)
var c2;
var svg1;
var xScale;
var yScale;
var xAxis;
var yAxis;
/*var dataset = [ {"key":"a","v":5},
	{"key":"b","v":10},
	{"key":"c","v":15},
	{"key":"d","v":20},
	{"key":"e","v":25} ];*/
var barConfig = {
	width : 960,
	height : 500,
	leftMargin : 150,
	topMargin : 50,
	yScale : 6.0,
	xScale : 35.0,
	barWidth : 30.0,
	chartWidth: 600,
	chartHeight : 300
}

//     ----------  airport  --------------
var width = 960,
    height = 500;

var projection = d3.geo.albers()
    .translate([width / 2, height / 2])
    .scale(1080);

var path = d3.geo.path()
    .projection(projection);

var voronoi = d3.geom.voronoi()
    .x(function(d) { return d.x; })
    .y(function(d) { return d.y; })
    .clipExtent([[0, 0], [width, height]]);

var svg = d3.select("#chart1").append("svg")
    .attr("width", width)
    .attr("height", height);

queue()
    .defer(d3.json, "data/us.json")
    .defer(d3.csv, "data/airports.csv")
    .defer(d3.csv, "data/flights.csv")
    .await(ready);

function ready(error, us, airports, flights) {
  var airportById = d3.map(),
      positions = [];

  airports.forEach(function(d) {
    airportById.set(d.iata, d);
    d.outgoing = [];
    d.incoming = [];
  });

  flights.forEach(function(flight) {
    var source = airportById.get(flight.origin),
        target = airportById.get(flight.destination),
        link = {source: source, target: target};
    source.outgoing.push(link);
    target.incoming.push(link);
  });

  airports = airports.filter(function(d) {
    if (d.count = Math.max(d.incoming.length, d.outgoing.length)) {
      d[0] = +d.longitude;
      d[1] = +d.latitude;
      var position = projection(d);
      d.x = position[0];
      d.y = position[1];
      return true;
    }
  });

  voronoi(airports)
      .forEach(function(d) { d.point.cell = d; });

  svg.append("path")
      .datum(topojson.feature(us, us.objects.land))
      .attr("class", "states")
      .attr("d", path);

  svg.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("class", "state-borders")
      .attr("d", path);

  var airport = svg.append("g")
      .attr("class", "airports")
    .selectAll("g")
      .data(airports.sort(function(a, b) { return b.count - a.count; }))
    .enter().append("g")
      .attr("class", "airport")
      .on('click',testfunction);

  airport.append("path")
      .attr("class", "airport-cell")
      .attr("d", function(d) { return d.cell.length ? "M" + d.cell.join("L") + "Z" : null; })
      //.on('click',testfunction);


  airport.append("g")
      .attr("class", "airport-arcs")
    .selectAll("path")
      .data(function(d) { return d.outgoing; })
    .enter().append("path")
      .attr("d", function(d) { return path({type: "LineString", coordinates: [d.source, d.target]}); });

  airport.append("circle")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("r", function(d, i) { return Math.sqrt(d.count); });

  airport.append("g")
    .append("class", "airport-text")
   .selectAll("circle")
    .data(function(d) { return d.i; })
    .enter().append("path")
    .attr("x", function(d,i){return d.x+5;})
    .attr("y", function(d,i){return d.y+15;})
    .text(d.iata);

}

// ----- Functions ------
//var ddd;
function dumpdata(d,i) {
    var ddd;
    ddd=d; console.log(d);
}

// present text to the cell when it's clicked
function testfunction(d,i){
    var iata_text;
    iata_text = d.iata;
    document.getElementById("clabel2").textContent = "Top 20 Outgoing Airports of: " + iata_text;
    
    dataset = [];
    
    for (var i=0; i<d.outgoing.length; i++) {   
    dataset.push({"key":d.outgoing[i].target.iata,"v":d.outgoing[i].target.count});
    }
    
    dataset.sort(function(a, b){return b["v"]-a["v"];})
    dataset = dataset.slice(0,Math.min(20, dataset.length));
    
    updateBars();
}

//   ------------  bars  ------------

// Selection of the div into which we will insert the chart 
c2 = d3.select("#chart2");

// Append an SVG to the div with an offset from the upper left corner
svg1 = c2.append("svg")
	.attr("width", barConfig.width)
	.attr("height", barConfig.height)
	.append("g")
	.attr("transform", "translate(" + barConfig.leftMargin + "," + barConfig.topMargin + ")")
	;

// Add the text label for the Y axis
svg1.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - 70)
    .attr("x",0 - (barConfig.height / 3))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Number of Outgoing Flights");

// create default scale
var yScale = d3.scale.linear()
    .domain([0, barConfig.yScale])
    .range([barConfig.chartHeight, 0])
    ;
var xScale = d3.scale.ordinal()
    .domain([])
    .rangeBands([0, barConfig.chartWidth])
    ;

// Create axes and append to SVG
xAxis = d3.svg.axis().scale(xScale).orient("bottom");
yAxis = d3.svg.axis().scale(yScale).orient("left");
svg1.append("g").attr("class", "xaxis axis")
	.attr("transform", "translate(0," + barConfig.chartHeight + ")")
	.call(xAxis);
svg1.append("g").attr("class", "yaxis axis").call(yAxis);


function dumpDataset()
{
	var e = document.getElementById("chart3");
	e.style.fontFamily='Courier';
	e.style.fontSize='12px';
	e.innerHTML = '';
	for (var i=0; i<dataset.length; i++) {
		var s = JSON.stringify(dataset[i]);
		e.innerHTML += s+'<br/>'
	}
}

// ----- Functions -----

// Update the DOM elements to reflect changes in the data array
function updateBars() {
	// Re-compute the scales
	adjustScales();
	// adjust the axes
	xAxis = d3.svg.axis().scale(xScale).orient("bottom");
	yAxis = d3.svg.axis().scale(yScale).orient("left");
	svg1.selectAll("g.xaxis.axis").transition().duration(500).call(xAxis);
	svg1.selectAll("g.yaxis.axis").transition().duration(500).call(yAxis);
	// Bind the new dataset
	var dataJoin = svg1.selectAll("rect")
		.data(dataset,function(d){return d.key;});
	var textJoin = svg1.selectAll("text.btext")
		.data(dataset,function(d){return d.key;});
		
	// The "enter" set consists of new data in the data array
	// The bar is initially set with zero height so it can transition later
	dataJoin.enter().append("rect")
		.attr("class", "bar")
		.attr("x", function(d,i){return xScale(i);})
		.attr("y", function(d,i){return barConfig.chartHeight;})
		.attr("width", function(d,i){return barConfig.chartWidth/dataset.length-4;})
		.attr("height", function(d,i) {return 0;})
		
	textJoin.enter().append("text")
		.attr("class", "btext")
		.attr("x", function(d,i){return xScale(i)+5;})
		.attr("y", function(d,i){return barConfig.chartHeight+15;})
		.text(function(d,i){return Math.round(d.v);})
		;
	// The "update" set now includes the "enter" set
	// A transition is applied to smootly change the data
	dataJoin.transition().duration(500)
		.attr("x", function(d,i){return xScale(d.key);})
		.attr("y", function(d,i){return yScale(d.v);})
		.attr("width", function(d,i){return barConfig.chartWidth/dataset.length-4;})
		.attr("height", function(d,i) {return barConfig.chartHeight-yScale(d.v);})
		;
	textJoin.transition().duration(500)
		.attr("class", "btext")
		.attr("x", function(d,i){return xScale(d.key)+5;})
		.attr("y", function(d,i){return yScale(d.v)+15;})
		.text(function(d,i){return Math.round(d.v);})
		;
	// The "exit" set is transitioned to zero height and removed
	dataJoin.exit().transition().duration(500)
		.attr("y", function(d,i){return barConfig.chartHeight;})
		.attr("height", function(d,i) {return 0;})
		.remove()
		;
	textJoin.exit().transition().duration(500)
		.attr("y", function(d,i){return barConfig.chartHeight+15;})
		.remove();
		;
}

// Adjust the X and Y scales
function adjustScales() {
	yScale = d3.scale.linear()
		.domain([0, d3.max(dataset, function(d){return d.v;})])
		.range([barConfig.chartHeight, 0])
		;
    
    // map function like list comprehension
    var xname = dataset.map(function(d){
        return d.key;
    });
                        
   /* for (var i=0; i<dataset.length; i++) {
        xname.push(dataset[i].key)
    };*/
    
	xScale = d3.scale.ordinal()
		.domain(xname)
		.rangeBands([0, barConfig.chartWidth])
		;
}
