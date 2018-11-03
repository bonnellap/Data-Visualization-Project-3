function createVis(data) {
    mapData = data[0];
    stationData = data[1];

    // All of your code should go here or call the functions that use mapData and stationData

    //Show is the array that will filter the mapData
    var show = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 164, 301, 302, 303, 306, 307, 308, 309, 355, 401, 402];

    //Remove all unnessesary districts from mapData
    mapData.features = mapData.features.filter(function (d) {
        for (var i = 0; i < show.length; i++) {
            if (d.properties.communityDistrict == show[i]) {
                return true;
            }
        }
        return false;
    });

    //Remove all unnessesary districts from stationData
    stationData = stationData.filter(function (d) {
        for (var i = 0; i < show.length; i++) {
            if (d.district == show[i]) {
                return true;
            }
        }
        return false;
    });

    createMap(mapData, stationData); // Create the map for part 1
    createScatterplot(mapData, stationData); // Create the scatterplot for part 2
    createChoropleth(mapData, stationData, show); // Create the choropleth for part 3
    createMap2(mapData, stationData); // Create the part 1 map with colors added to the stations
    createLeaflet(mapData, stationData, show); // Create the part3 map using leaflet
}

//Creates the map visualization
function createMap(mapData, stationData) {
    //Set the svg width and height
    var width = 600, height = 600;

    //svg element creation
    var svg = d3.select("#station-map").append("svg") //Create svg element
        .attr("width", width) //Set svg width
        .attr("height", height); //Set svg height

    //projection for map
    var projection = d3.geoMercator()
        .fitSize([width, height], mapData); //translates and scales the projection to fit the data

    //create the paths
    svg.selectAll("path")
        .data(mapData.features) //Use the data from mapData
        .enter().append("path") //create a new path
        .attr("fill", "#D0D3D4") //Fill color
        .attr("stroke", "black") //Stroke color
        .attr("d", d3.geoPath(projection)); //path data

    //Create the points for the bike locations
    svg.selectAll("circle")
        .data(stationData) //Use the data from stationData
        .enter().append("circle") //create new circles
        .attr("cx", d => projection([d.longitude, d.latitude])[0]) //Use the projection to calculate the x coordinate
        .attr("cy", d => projection([d.longitude, d.latitude])[1]) //Use the projection to calculate the y coordinate
        .attr("r", "3px") //set the radius
        .attr("fill", "red"); //set the fill color
}

//Creates the scatterplot visualization
function createScatterplot(mapData, stationData) {
    var margin = { top: 20, bottom: 40, right: 20, left: 40 }; //The margins around the borders of the scatterplot data
    var svgWidth = 600; //The svg width
    var svgHeight = 600; //The svg height
    var width = svgWidth - margin.left - margin.right; //The width for the scatterplot data
    var height = svgHeight - margin.top - margin.bottom; //The height for the scatterplot data

    //X axis : Available Bikes
    var xScale = d3.scaleLinear()
        .range([0, width])
        .domain([0, d3.max(stationData.map(d => +d["availableBikes"]))]);

    //Y axis : Available Docks
    var yScale = d3.scaleLinear()
        .range([0, height])
        .domain([d3.max(stationData.map(d => +d["availableDocks"])), 0]);

    //color scale
    var colorScale = d3.scaleOrdinal(d3.schemeSet1);

    //svg element creation
    var svg = d3.select("#scatterplot").append("svg") //Create SVG element
        .attr("width", svgWidth) //Set the svg width
        .attr("height", svgHeight) //Set the svg height
        .append("g") //add a group to the svg
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); //Translate the group to match the margins

    //X axis creation
    svg.append("g") // X-axis group for easier group translation
        .attr("transform", "translate(0," + height + ")") //translate the axis down sice it starts at the top of the graph
        .call(d3.axisBottom(xScale)) //set the scale of the x-axis and create it
        .append("text") //add the label
        .attr("class", "label") //set the class of the label
        .attr("transform", "translate(" + width / 2 + ",30)") //translate the label to the correct position
        .text("Available Bikes"); //set the label text

    //Y axis creation
    svg.append("g") // Y-axis group for easier group translation
        .call(d3.axisLeft(yScale)) //set the scale of the y-axis
        .append("text") //add the y label
        .attr("class", "label") //set the class of the label
        .attr("transform", "rotate(-90)") //rotate the text to align with the axis
        .attr("x", -height / 2) //set the x value
        .attr("y", -30) //set the y value
        .text("Available Docks"); //set the label text

    //create the points on the scatterplot
    svg.selectAll("circle") //get circle elements
        .data(stationData) //set the data for the circle elements
        .enter().append("circle") //Make a new circle
        .attr("class", "point") //give it the class .point
        .attr("cx", d => xScale(+d["availableBikes"])) //set the x value to the number of available bikes
        .attr("cy", d => yScale(+d["availableDocks"])) //set the y value to the number of available docks
        .attr("r", 3) //set the radius
        .style("fill", function (d) { //fill color based on the color scale of the district
            var district = +(d["district"].substring(0, 1));
            return colorScale(district);
        });

    //legend help came from : https://bl.ocks.org/jkeohan/b8a3a9510036e40d3a4e
    //create the legend
    var legend = svg.selectAll(".legend") //select all legend elements
        .data(colorScale.domain()) //set the data for the legend (color scale domain)
        .enter().append("g") //add a group for each color
        .attr("class", "legend") //set the class
        .attr("transform", function (d, i) { //translate the groups based on their order so they do not overlap
            return "translate(" + width + "," + i * 20 + ")";
        });

    //add rectangles to legend
    legend.append("rect") //add a rectangle element
        .attr("x", 0) //set x
        .attr("y", 0) //set y
        .attr("width", 10) //set width
        .attr("height", 10) //set height
        .style("fill", d => colorScale(d)); //set the color based on the scale color

    //add text to legend
    legend.append("text") //add a text element
        .attr("class", "legendText") //add a class (controlled by css)
        .attr("x", -5) //set x
        .attr("y", 9) //set y
        .text(function (d) { //set the text based on the district number
            switch (d) {
                case 1:
                    return "Manhattan";
                case 3:
                    return "Brooklyn";
                case 4:
                    return "Queens";
            }
        });
}

//Function to get the percentage of available bikes
function getPercentArray(stationData, show) {
    //bike data using nests
    var bikes = d3.nest()
        .key(d => d.district)
        .rollup(a => a.reduce((s, d) => s + (+d.availableBikes), 0))//the sum of the available bikes
        .map(stationData);

    //dock data using nests
    var docks = d3.nest()
        .key(d => d.district)
        .rollup(a => a.reduce((s, d) => s + (+d.totalDocks), 0))//the sum of the docks
        .map(stationData);

    //a new array that stores data as district and percentage of docks used
    var percentArray = show.map(function (d) {
        var percent = bikes["$" + d] / docks["$" + d];
        return { "district": d, "percent": percent };
    });

    return percentArray;
}

function createChoropleth(mapData, stationData, show) {
    //Set the svg width and height
    var width = 600, height = 600;

    //svg element creation
    var svg = d3.select("#availability-map").append("svg") //Create svg element
        .attr("width", width) //Set svg width
        .attr("height", height); //Set svg height

    //projection for map
    var projection = d3.geoMercator()
        .fitSize([width, height], mapData); //translates and scales the projection to fit the data

    //Get a percent array
    var percentArray = getPercentArray(stationData, show);

    //color scale
    var colorScale = d3.scaleSequential(d3.interpolateRdBu);

    //create the paths
    svg.selectAll("path")
        .data(mapData.features) //Use the data from mapData
        .enter().append("path") //create a new path
        .attr("fill", function (d) { //fill color
            var dist = d.properties.communityDistrict; //get district number
            var percent = percentArray.filter(d => d.district === dist)[0].percent; //get distrinct percentage
            return (colorScale(1 - percent)); //return the color for that percentage
        })
        .attr("stroke", "black") //Stroke color
        .attr("d", d3.geoPath(projection)); //path data

    //Legend for the graph
    var legend = svg.append("g") //make a group for the legend
        .attr("transform", "translate(20,0)"); //put the legend in a good place

    //Image for the legend
    legend.append("image")
        .attr("xlink:href", "https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/RdBu.png") //Link to the image
        .attr("transform", "scale(1,50)") //scale the image to make it thicker
        .attr("x", 0) //set the x value
        .attr("y", 0) //set the y value
        .attr("width", 200) //set the width
        .attr("height", 1); //set the height

    //Text for the legend
    legend.append("text")
        .attr("class", "label") //set the style to match other labels
        .attr("x", 100)
        .attr("y", 10)
        .text("Bike Availability Percentage");

    //Text for 0%
    legend.append("text")
        .attr("x", 0)
        .attr("y", 50)
        .text("0%");

    //Text for 100%
    legend.append("text")
        .style("text-anchor", "end")
        .attr("x", 200)
        .attr("y", 50)
        .text("100%");

    //Text for 50%
    legend.append("text")
        .style("text-anchor", "middle")
        .attr("x", 100)
        .attr("y", 50)
        .text("50%");

}

//This uses the same underlying code as the first section, but the dots are colored based on available bikes
function createMap2(mapData, stationData) {
    //Set the svg width and height
    var width = 600, height = 600;

    //svg element creation
    var svg = d3.select("#station-color-map").append("svg") //Create svg element
        .attr("width", width) //Set svg width
        .attr("height", height); //Set svg height

    //projection for map
    var projection = d3.geoMercator()
        .fitSize([width, height], mapData); //translates and scales the projection to fit the data

    //create the paths
    svg.selectAll("path")
        .data(mapData.features) //Use the data from mapData
        .enter().append("path") //create a new path
        .attr("fill", "grey") //Fill color
        .attr("stroke", "black") //Stroke color
        .attr("d", d3.geoPath(projection)); //path data

    //Set the color scale for the points
    var colorScale = d3.scaleSequential(d3.interpolateBlues);
    //Get the max number of available bikes
    var maxValue = d3.max(stationData.map(d => +d["availableBikes"]));

    //Create the points for the bike locations
    svg.selectAll("circle")
        .data(stationData) //Use the data from stationData
        .enter().append("circle") //create new circles
        .attr("cx", d => projection([d.longitude, d.latitude])[0]) //Use the projection to calculate the x coordinate
        .attr("cy", d => projection([d.longitude, d.latitude])[1]) //Use the projection to calculate the y coordinate
        .attr("r", "3px") //set the radius
        .attr("fill", d => colorScale((+d.availableBikes) / maxValue)); //set the fill color

    //Legend for the graph
    var legend = svg.append("g") //make a group for the legend
        .attr("transform", "translate(20,0)"); //put the legend in a good place

    //Image for the legend
    legend.append("image")
        .attr("xlink:href", "https://raw.githubusercontent.com/d3/d3-scale-chromatic/master/img/Blues.png") //Link to the image
        .attr("transform", "scale(1,50)") //scale the image to make it thicker
        .attr("x", 0) //set the x value
        .attr("y", 0) //set the y value
        .attr("width", 200) //set the width
        .attr("height", 1); //set the height

    //Text for the legend
    legend.append("text")
        .attr("class", "label") //set the style to match other labels
        .attr("x", 100)
        .attr("y", 10)
        .text("# of Bikes per Station");

    //Text for 0 bikes
    legend.append("text")
        .attr("x", 0)
        .attr("y", 50)
        .text("0");

    //Text for all bikes
    legend.append("text")
        .style("text-anchor", "end")
        .attr("x", 200)
        .attr("y", 50)
        .text(maxValue);
}

function createLeaflet(mapData, stationData, show) {
    //Set up the map
    var mymap = L.map('mapid').setView([40.74, -74.00], 11);

    //This code comes from https://leafletjs.com/examples/quick-start/ to get the map started
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18,
        id: 'mapbox.streets',
        accessToken: 'pk.eyJ1IjoiYm9ubmVsbGFwIiwiYSI6ImNqbnYyMjQzbTAyMHgzcHBtMXVoYXptNnEifQ.oZVJYkHeZJn8MOfvqKC73Q'
    }).addTo(mymap);

    //make a color scale
    var colorScale = d3.scaleSequential(d3.interpolateRdBu);
    //Get the max number of available bikes
    var maxValue = d3.max(stationData.map(d => +d["availableBikes"]));

    //get the percent array
    var percentArray = getPercentArray(stationData, show);

    //Used with the help of https://leafletjs.com/examples/choropleth/ to set up the colors and styles
    function style(d) {
        var dist = d.properties.communityDistrict; //get district number
        var percent = percentArray.filter(d => d.district === dist)[0].percent; //get distrinct percentage
        var color = (colorScale(1 - percent)); //return the color for that percentage
        return {
            fillColor: color,
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.6
        }
    }
    //Add areas to the map with the styles
    L.geoJson(mapData, { style: style }).addTo(mymap);

}

// this loads the data and calls the createVis function
Promise.all([d3.json("https://gitcdn.xyz/repo/dakoop/fb4d65af84db0ee3f2233e02cdeb1874/raw/9a819d894ff29f786b61b7c3d0fa18f84b244362/nyc-community-districts.geojson"),
d3.csv("https://gitcdn.xyz/repo/dakoop/fb4d65af84db0ee3f2233e02cdeb1874/raw/bb31d4c41bda64891455a68741accdfef40aeef3/bikeStationData.json")]).then(createVis)
