var maps_path = {20: {"provinces": "https://raw.githubusercontent.com/minsukkahng/southkorea-maps/precinct/kostat/2013/json/skorea_provinces_topo.json", "precinct": "https://raw.githubusercontent.com/minsukkahng/southkorea-maps/precinct/popong/precinct/assembly-precinct-20-topo-simplified.json"}}
var topo_key = {20: {"provinces": "skorea_provinces_geo", "precinct": "precincts"}}

var assembly_no = 20;

var width = document.querySelector('.d3-div').clientWidth;

var height = 720 * width / 960;
var active = d3.select(null);
var choice;
var selectCity = false; // 확대가 되었느냐 안되었느냐로 가져올 데이터값을 다르게 해주기위해 만들어 놓음
var sendData = new Object(); //보내줄 데이터를 저정할 object를 만들어준다.
sendData.city = null;
sendData.district = null;

var proj = d3.geo.mercator()
    .center([128.0, 35.9])
    .scale(6000)
    .translate([width/2, height/2]);

var path = d3.geo.path()
    .projection(proj);

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

svg.append("rect")
    .attr("class", "d3-background")
    .attr("width", width)
    .attr("height", height)
    .on("click", reset);

var g = svg.append("g");

var precinct_person = {}; 

var gm = g.append("g");
var gp = g.append("g");

d3.json(maps_path[assembly_no]["provinces"], function(error, kor) {
    var provinces = topojson.feature(kor, kor.objects[topo_key[assembly_no]["provinces"]]);
    var g_provinces = gp.selectAll('g')
        .data(provinces.features, function(d) { return d.properties.code; })
        .enter()
        .append('g')
        .attr('class', 'g_province');
    
    g_provinces.append('path')
        .attr('d', path)
        .attr('class', 'province')
        .on("click", clicked)
        .append("title")
        .text(function(d) { return d.properties.name; });
        // .on("click", cityClick()) click event 만들어주기
    g_provinces.append("text")
        .attr("class", "province-label")
        .attr("id", function(d) { return "province-label " + d.properties.code; })
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("dy", function(d) { if( d.properties.code == 31 ) return "20px"; }) // Gyeonggi to separate from Seoul
        .text(function(d) { return d.properties.name; });

    g_provinces.on("mouseover", function() {
        d3.select(this).select("path").classed("highlighted", true);
        
    });
    g_provinces.on("mouseout", function() {
        d3.select(this).select("path").classed("highlighted", false);
    })
});

d3.json(maps_path[assembly_no]["precinct"], function(error, kor) {
    var precincts = topojson.feature(kor, kor.objects[topo_key[assembly_no]["precinct"]]);
    
    var g_precincts = gm.selectAll('g')
        .data(precincts.features, function(d) { return d.properties.precinct_no; })
        .enter()
        .append('g')
        .attr('class', 'g_precinct');
    
    g_precincts
        .append('path')
        .attr('d', path)
        .attr('class', 'precinct')
        .on('click',clicked)
        .append("title")
        .text(function(d) { return d.properties.precinct_name; });

    g_precincts.append("text")
        .attr("class", "precinct-label")
        .attr("transform", function(d) { return "translate(" + path.centroid(d) + ")"; })
        .attr("dy", ".35em")
        .text(function(d) { return d.properties.precinct_name; });
    
    g_precincts.select("path.precinct")
        .style("fill", function(d) { return "#999999"; })
        

    g_precincts.on("mouseover", function() {
        d3.select(this).select("path").classed("highlighted", true);

        var html_text = '<h3>'+d3.select(this).datum().properties.precinct_name+'</h3>';
        // You can add more
        choice = d3.sel
        html_text += '<div></div>';
        
        var point = d3.mouse(this);
        d3.select("#info")
            .style("left", function(d) { return point[0]+"px"; })
            .style("top", function(d) { return point[1]+"px"; })
            .style("visibility", "visible")
            .html(html_text)
            
    });
    g_precincts.on("mouseout", function() {
        d3.select(this).select("path").classed("highlighted", false);
        d3.select("#info")
            .style("visibility", "hidden");
    })

});

function clicked(d) {
    if (active.node() === this) {
        sendData.city = $(this).select('.g_province').select('.province-label').text()
        sendData.district = null;

        return reset();
    }

    //json data 생성하는 작업
    if (active.node() !== null) {
        sendData.district = $(this).select('.g_precinct').select('.precinct-lable').text()
        var jsonData = JSON.stringify(sendData)
        $.ajax({
            type: "GET",
            url: "http://127.0.0.1:8000/" + sendData.city+sendData.district,
            data: jsonData,
            dataType: "json",
            success: function (response) {
                $('.con_name').html(response.name)
                $('.con_district').html(response.district)
                $('.con_crime').html(response.crime)
                $('.con_party').html(response.party)
                
                $('section:nth-child(2)').attr('class', 'background down-scroll');
                //현재상황 1.지도에서 정보로 넘어가는 효과까지는 들어가나 반대의 경우 휠을 계속 돌려야 가능해짐;
                // 2. 새로고침을 하지 않으면 지도의 다시한번 클릭이 불가능함.
                sendData.city = null;
                sendData.district = null;
                
                return reset();
                }
                
            });
        
    } else {
        sendData.city = $(this).select('.g_province').select('.province-label').text()
    

    
        // this 가 클릭한 도시의 path 태그
        active.classed("active", false);
        active = d3.select(this).classed("active", true);

        var bounds = path.bounds(d),
                dx = bounds[1][0] - bounds[0][0],
                dy = bounds[1][1] - bounds[0][1],
                x = (bounds[0][0] + bounds[1][0]) / 2,
                y = (bounds[0][1] + bounds[1][1]) / 2,
                scale = .7 / Math.max(dx / width, dy / height),
                translate = [width / 2 - scale * x, height / 2 - scale * y];
            
        g.transition()
                .duration(750)
                .style("stroke-width", 1.5 / scale + "px")
                .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
                
        d3.selectAll(".province").classed("selected", false);
        d3.selectAll(".province").classed("notselected", false);
        d3.selectAll(".precinct").classed("selected", false);
        d3.selectAll("text.precinct-label").style("visibility", "hidden");

        d3.selectAll(".province").style("stroke-width", 2 / scale + "px");
        d3.selectAll(".precinct").style("stroke-width", 1 / scale + "px");

        d3.selectAll("text.province-label").style("font-size", 14 / scale + "px");

        if( d3.select(this).classed("province") ) {
            d3.selectAll(".province").classed("notselected", true);
            d3.select(this).classed("notselected", false);
            d3.select(this).classed("selected", true);
            d3.selectAll("text.precinct-label")
                .style("visibility", "visible")
                .style("font-size", 10 / scale + "px");
        }
    }
    
}

function reset() {
    
    active.classed("active", false);
    active = d3.select(null);

    g.transition()
            .duration(750)
            .style("stroke-width", "1.5px")
            .attr("transform", "");

    d3.selectAll(".province").classed("selected", false);
    d3.selectAll(".province").classed("notselected", false);
    d3.selectAll(".precinct").classed("selected", false);
    d3.selectAll("text.precinct-label").style("visibility", "hidden");
    d3.selectAll("text.province-label").style("font-size", "10px");
}

// function cityClick() {
    
    // var city = $('.highlighted').text()
    // var sendData = new Object();

    // sendData.city = city
    // sendData.district = $('#info').text()

    // var jsonData = JSON.stringify(sendData)

    // console.log(jsonData)
// }