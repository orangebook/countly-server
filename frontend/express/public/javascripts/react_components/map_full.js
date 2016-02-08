var Map = React.createClass({

    cityPoints : false,

    getInitialState : function() {

        var self = this;

        console.log("{{{{{{{{{{{{{{{[ this.props.metric ]}}}}}}}}}}}}}}}");
        console.log(this.props.metric);

        this.formatCountryData(this.props.metric, function(error, cityPoints){

            console.log("------- cityPoints ------------");
            console.log(cityPoints);

            self.cityPoints = cityPoints;

        });

        return {
            element_id : "map",
            //current_metric : this.props.metric
        }

    },

    previous_data : false,

    world_map_popup : function(geography, data) {

        if (data)
        {
            var string = '<div class="hoverinfo"><strong>' + geography.properties.name + " : " + data.numberOfThings.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); + '</strong></div>';
        }
        else
        {
            var string = '<div class="hoverinfo"><strong>' + geography.properties.name + ' : 0</strong></div>';
        }

        return string;
    },

    country_return_popup : function(geography, data) {

        var string = '<div class="hoverinfo"><strong>return to world map</strong></div>';

        return string;
    },

    city_popup : function(geo, data) {

        var cityName = data.name.charAt(0).toUpperCase() + data.name.slice(1);

        var html = "<div class='hoverinfo'>";
        html += "<div><b>city: " + cityName + "</b></div>";
        html += "<div>metric: " + data.metric + "</div>lat:" + data.latitude + ", long:" + data.longitude;
        html += "</div>";

        return html;
    },

    draw : function() {

        var self = this;

        $("#" + this.state.element_id).empty();

        console.log("============ draw this.props.metric =================");
        console.log(this.props.metric);

        //var ob = {id:'total', label:$.i18n.map["sidebar.analytics.sessions"], type:'number', metric : this.props.metric/*this.state.current_metric*//*"t"*/};

        var ob = this.props.metric;

        var countryFills = {
            defaultFill : "#c0dffb"
        }

        console.log("========== draw ob ============");
        console.log(ob);

        var countryData = this.formatData(ob);

        this.previous_data = countryData;

        console.log("++++++++++++++= countryData =+++++++++++++");
        console.log(countryData);


        /*
          create 10 gradations of brightness
        */

        //countryFills["0.0"] = "#c0dffb";

        //var gradient = this.make_gradient("#c0dffb", "#198AF3", 10);

        var gradient = this.make_gradient("#198af3", "#c0dffb", 10);

        console.log("==== gradient ===");
        console.log(gradient);

        var j = 0;

        for (var i = 0/* 0.1*/; i < 1; i+=0.1)
        {
            //countryFills[i.toFixed(1).toString()] = this.colorLuminance(countryFills["0.0"], i * (-1)); // .toFixed(1) because Javascript have some problem with float: http://stackoverflow.com/questions/1458633/how-to-deal-with-floating-point-number-precision-in-javascript
            countryFills[i.toFixed(1).toString()] = "#" + gradient[j];
            j++
        }

        countryFills["1.0"] = "#198af3"; // todo:

        console.log("=========== country fills ========");
        console.log(countryFills);

        var chart_options = {
            borderWidth: 1,
            borderColor: '#E6E6E6',
            popupOnHover: true,
            highlightOnHover: true,
            highlightFillColor: "#024873",
            highlightBorderColor: '#aaa',
            highlightBorderWidth: 1,
            popupTemplate : this.world_map_popup
        }

        _datamap = new Datamap({
            element : document.getElementById(this.state.element_id),
            height  : this.props.height,
            width   : this.props.width,
            //projection : 'mercator',
            fills      : countryFills,
            geographyConfig : chart_options,
            data : countryData
        });


        _datamap.svg.selectAll('path').on('click', function(elem) {

            var countryIso = elem.id;

            console.log("countly iso:", countryIso);

            console.log("tihs props:", self.props.metric);

            self.draw_country({
                height : 450,
                metric : self.props.metric,
                "countryIso3" : countryIso
            });

        });

    },

    redraw : function () {

        //var ob = {id:'total', label:$.i18n.map["sidebar.analytics.sessions"], type:'number', metric : this.props.metric/*this.state.current_metric*//*"t"*/};

        var ob = this.props.metric;

        var countryData = this.formatData(ob);

        for (var iso3 in this.previous_data)
        {
            if (!countryData[iso3])
            {
                countryData[iso3] = {
                    "fillKey"        : "0.0",
                    "numberOfThings" : 0
                };
            }
        }

        console.log("================ redraw countryData ================");
        console.log(countryData);

        this.previous_data = countryData;

        _datamap.updateChoropleth(countryData);

        return true;
    },

    draw_country : function(options) {

        var self = this;

        var chart_options = {
            borderWidth: 1,
            borderColor: "#575757"/*'#E6E6E6'*/,
            popupOnHover: true,
            highlightOnHover: true,
            highlightFillColor: "#024873",
            highlightBorderColor: '#aaa',
            highlightBorderWidth: 1,
            popupTemplate : this.country_return_popup
        }

        console.log("- draw country ---");
        console.log(options);

        _periodObj = countlyCommon.periodObj;

        //$("#" + this.state.element_id).empty();

        if (options) {
            if (options.chartElementId) {
                _chartElementId = options.chartElementId;
            }

            if (options.height) {
                chart_options.height = options.height;

                //preserve the aspect ratio of the chart if height is given
                chart_options.width = (options.height * 556 / 347);
            }
        }

        if (options.countryIso3)
        {
/*
            console.log("----------- ajax request ---------");
            console.log(countlyCommon.API_PARTS.data.r);
*/
            return $.ajax({
                type:"GET",
                url:countlyCommon.API_PARTS.data.r,
                data:{
                    "api_key" : countlyGlobal.member.api_key,
                    "app_id"  : countlyCommon.ACTIVE_APP_ID,
                    "method"  : "country_latlon",
                    "iso3"    : options.countryIso3
                },
                dataType:"jsonp",
                success:function (json) {

                    /*
                        Get country size for calculate scale
                    */

                    console.log("country data 00000000000:");
                    console.log(json);


                    var lat_size = json.location_box.max_lat - json.location_box.min_lat;
                    var lon_size = json.location_box.max_lon - json.location_box.min_lon;

                    if (lat_size > lon_size)
                    {
                        var max_latlon_size = lat_size;
                    }
                    else
                    {
                        var max_latlon_size = lon_size;
                    }

                    var zoomParams = {
                        "iso3" : json.iso3,
                        "lat"  : json.lat,
                        "lon"  : json.lon,
                        "size" : parseInt(json.size),
                        "lat_size" : lat_size,
                        "lon_size" : lon_size,
                        "max_latlon_size" : max_latlon_size,
                        "location_box"    : json.location_box
                    }

                    console.log("=========== zoomParams ===========");
                    console.log(zoomParams);

                    self._draw_country(options.metric, zoomParams, chart_options);

                }
            });
        }
        else
        {
            console.log("error");
            return false;
        }
    },

    _draw_country : function(ob, zoomParams, chart_options) {

        var self = this;
/*
        var chart_options = {
            borderWidth: 1,
            borderColor: '#333333',
            popupOnHover: true,
            highlightOnHover: true,
            highlightFillColor: "#024873",
            highlightBorderColor: '#024873',
            highlightBorderWidth: 1,
            popupTemplate : this.countrypopupTemplate
        }
*/

        if (!zoomParams/* || !zoomParams.size*/)
        {
            /* todo */
            /*countlyLocation.drawGeoChart(false);
            store.set("countly_location_city", false);*/
            return false;
        }

        _chartElementId = this.state.element_id;

        $("#" + _chartElementId).empty();

            console.log("------- cityPoints ------------");
            console.log(this.cityPoints);

            /*
              create map
            */

            var containerHeigth = d3.select("#" + self.state.element_id).node().getBoundingClientRect().height;
            var containerWidth  = d3.select("#" + self.state.element_id).node().getBoundingClientRect().width;

            containerHeigth = 400; // todo!!!

            console.log("containerHeigth:", containerHeigth);
            console.log("containerWidth:", containerWidth);

            var mapHeight = containerHeigth - 50;
            var mapWidth  = mapHeight * 1.48;

            /*$("#" + _chartElementId).css("margin-left", containerWidth/2 * -1); // center the map element
            $("#" + _chartElementId).css("margin-top", 10);
*/
            var colors = d3.scale.category10();

            //var scale = 1000 - (zoomParams.size * 0.00005);
            //var scale = parseInt(600 - zoomParams.max_latlon_size);
            //scale = 310;

            var wScale = mapWidth  / (Math.abs(zoomParams.lon_size) / 360) / 2 / Math.PI;
            var hScale = mapHeight / (Math.abs(zoomParams.lat_size) / 360) / 2 / Math.PI;
            var scale = Math.min(wScale, hScale)

            //scale = 400;

            console.log("zoomParams.max_latlon_size:", zoomParams.max_latlon_size);
            console.log("country scale:", scale);
            console.log("zoom params:");
            console.log(zoomParams);

            if (scale > 300)
            {
                scale -= 200;
            }

            var map_data = { };

            map_data[zoomParams.iso3] = {
                "fillKey" : "selected"
            }

            _datamap = new Datamap({
                element    : document.getElementById(_chartElementId),
                height     : mapHeight,
                width      : mapWidth,
                setProjection: function(element) {

                    var center_lat = parseFloat(zoomParams.lat.toFixed(3));
                    var center_lon = parseFloat(zoomParams.lon.toFixed(3));

                    /* override */
                    //center_lat = 51.5;
                    //center_lon = 0;
                    //scale      = 600;

                    var width_projection = (element.offsetHeight / 2) * 1.92;

                    console.log("translate:", element.offsetWidth / 2, " -- ", element.offsetHeight / 2);
                    console.log("center_lon:", center_lon);
                    console.log("center_lat:", center_lat);

                    //center_lon += 34;

                    var projection = d3.geo.mercator()
                            .center([center_lon, center_lat])
                            //.rotate([-32, 0])
                            .scale(scale)
                            //.translate([element.offsetWidth / 2, element.offsetHeight / 2]);
                            .translate([mapWidth/2, mapHeight/2]); // You should also only translate the projection by half the width and height of the container, otherwise the center will be in the bottom right corner.

                    var path = d3.geo
                                .path()
                                .projection(projection);

                    return {
                              "path"       : path,
                              "projection" : projection
                           };
                },
                fills: {
                    "defaultFill" : "#fff", //_defaultFill,
                    "selected"    : "#198af3",
                    "bubble"      : "#12fa34",
                },
                geographyConfig: chart_options,
                data : map_data
            });

            _datamap.bubbles(this.cityPoints, { "popupTemplate" : this.city_popup });

            _datamap.svg.selectAll('path').on('click', function(elem) {

                console.log("------- return click ------");

                self.draw();

                //countlyLocation.drawGeoChart(false);
                //store.set("countly_location_city", false);
                return true;
            });

            _datamap.graticule();

    },

    formatData : function (ob){

        console.log("=========== formatData ===========");
        console.log(ob);

        var chartData = {cols:[], rows:[]};

        var _locationsDb = countlyUser.getDbObj();
        var _countries = _locationsDb['meta']['countries'];// countlyCommon.union({}, _locationsDb['meta']['countries']);

        var tt = countlyCommon.extractTwoLevelData(_locationsDb, _countries, countlyLocation.clearLocationObject, [
            {
                "name":"country",
                "func":function (rangeArr, dataObj) {
                    return countlyLocation.getCountryName(rangeArr);
                }
            },
            {
                "name":"code",
                "func":function (rangeArr, dataObj) {
                    return countlyLocation.getCountryCode(rangeArr);
                }
            },
            { "name":"t" },
            { "name":"u" },
            { "name":"n" }
        ]);

        chartData.cols = [
            {id:'country', label:$.i18n.map["countries.table.country"], type:'string'}
        ];
        chartData.cols.push(ob);

        var maxMetric = 0;

        chartData.rows = _.map(tt.chartData, function (value, key, list) {

            if (value.country == "European Union" || value.country == "Unknown" || value.code == "Unknown") {
                return {
                    /* todo */
                };
            }

            if (value[ob.metric] > maxMetric)
            {
                maxMetric = value[ob.metric];
            }

            return {
                code    : value.code,
                country : value.country,
                metric  : value[ob.metric]
            };
        });

        var linear = d3.scale.linear()
          .domain([0, maxMetric])
          .range([0.1, 1]);

        var countryData = { };

        for (var i = 0; i < chartData.rows.length; i++)
        {
            var country = chartData.rows[i]["code"];
            var metric  = chartData.rows[i]["metric"];
            var linearMetric = (linear(metric) * 0.6).toFixed(1).toString();

/*
            if (country == "CHN")
            {
                countryData[country] = {
                    "fillKey"        : 'increase',
                    "numberOfThings" : metric
                }
            }
            else if (country == "AUS")
            {
                countryData[country] = {
                    "fillKey"        : 'decrease',
                    "numberOfThings" : metric
                }
            }
            else
            {*/
                countryData[country] = {
                    "fillKey"        : linearMetric,
                    "numberOfThings" : metric
                }
            /*}*/
        }

        console.log("============= formatted data ==========");
        console.log(countryData);

        return countryData;
    },

    formatCountryData : function(ob, __callback){


        _period = countlyCommon.getPeriodForAjax();


        _activeAppKey = countlyCommon.ACTIVE_APP_KEY;
        _initialized = true;

        return $.ajax({
            type:"GET",
            url:countlyCommon.API_PARTS.data.r,
            data:{
                "api_key":countlyGlobal.member.api_key,
                "app_id":countlyCommon.ACTIVE_APP_ID,
                "method":"cities",
                "period":_period
            },
            dataType:"jsonp",
            success:function (json) {
                _locationsDb = json;
                //setMeta();

                if (_locationsDb['meta']) {
                    _cities = (_locationsDb['meta']['cities']) ? _locationsDb['meta']['cities'] : [];
                } else {
                    _cities = [];
                }

                ob = ob || {id:'total', label:$.i18n.map["sidebar.analytics.sessions"], type:'number', metric:"t"};
                var chartData = {cols:[], rows:[]};

                var tt = countlyCommon.extractTwoLevelData(_locationsDb, _cities, countlyCity.clearLocationObject, [
                    {
                        "name":"city",
                        "func":function (rangeArr, dataObj) {
                            return rangeArr;
                        }
                    },
                    { "name":"t" },
                    { "name":"u" },
                    { "name":"n" }
                ]);

                chartData.cols = [
                    {id:'city', label:"City", type:'string'}
                ];
                chartData.cols.push(ob);

                var maxMetric = 0;

                chartData.rows = _.map(tt.chartData, function (value, key, list) {
                    if (value.city == "Unknown") {
                        return {};
                    }

                    if (value[ob.metric] > maxMetric)
                    {
                        maxMetric = value[ob.metric];
                    }

                    return {
                        city   : value.city,
                        metric : value[ob.metric]
                    };
                });

                var linear = d3.scale.linear()
                    .domain([0, maxMetric])
                    .range([5, 20]);

                var cityPoints = [];

                chartData.rows.forEach(function(cityChartData){

                    if (!cityChartData.city)
                    {
                        return false;
                    }

                    var cityName   = cityChartData.city.toLowerCase();
                    var coordsData = _locationsDb.citiesData[cityName];

                    if (!coordsData)
                    {
                        return false;
                    }

                    var linearMetric = parseInt(linear(cityChartData.metric));

                    if (!coordsData.lat || !coordsData.lon)
                    {
                        return false;
                    }

                    cityPoints.push({
                        name      : cityName,
                        metric    : cityChartData.metric,
                        radius    : linearMetric,
                        fillKey   : 'bubble',
                        latitude  : parseFloat(coordsData.lat),
                        longitude : parseFloat(coordsData.lon)
                    });
                });

                __callback(false, cityPoints);

            }
        });

    },

    make_gradient : function(start_color, end_color, colors_count)
    {
        function hex (c) {
            var s = "0123456789abcdef";
            var i = parseInt (c);
            if (i == 0 || isNaN (c))
              return "00";
            i = Math.round (Math.min (Math.max (0, i), 255));
            return s.charAt ((i - i % 16) / 16) + s.charAt (i % 16);
        }

        /* Convert an RGB triplet to a hex string */
        function convertToHex (rgb) {
            return hex(rgb[0]) + hex(rgb[1]) + hex(rgb[2]);
        }

        /* Remove '#' in color hex string */
        function trim (s) { return (s.charAt(0) == '#') ? s.substring(1, 7) : s }

        /* Convert a hex string to an RGB triplet */
        function convertToRGB (hex) {
            var color = [];
            color[0] = parseInt ((trim(hex)).substring (0, 2), 16);
            color[1] = parseInt ((trim(hex)).substring (2, 4), 16);
            color[2] = parseInt ((trim(hex)).substring (4, 6), 16);
            return color;
        }

        function generateColor(colorStart,colorEnd,colorCount){

            // The beginning of your gradient
            var start = convertToRGB (colorStart);

            // The end of your gradient
            var end   = convertToRGB (colorEnd);

            // The number of colors to compute
            var len = colorCount;

            //Alpha blending amount
            var alpha = 0.0;

            var saida = [];

            for (i = 0; i < len; i++) {
              var c = [];
              alpha += (1.0/len);

              c[0] = start[0] * alpha + (1 - alpha) * end[0];
              c[1] = start[1] * alpha + (1 - alpha) * end[1];
              c[2] = start[2] * alpha + (1 - alpha) * end[2];

              saida.push(convertToHex (c));

            }

            return saida;

        }

        var tmp = generateColor(start_color, end_color, colors_count);

        return tmp;

    },

    render : function(){

        return (
            <div className="map_wrapper">
                <div className="search_block">
                    <div className="icon"></div>
                    <input type="search" placeholder="Search for Country"/>
                </div>
                <div id="map">

                </div>
            </div>
        )
    },

    componentDidMount : function()
    {
        this.draw();
    },

    componentDidUpdate : function()
    {
        this.redraw();
    }

})