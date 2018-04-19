declare var L: any;
declare var jQuery: any;

let map;
let busStopLayer;
let busStopProvider;

window.onload = () => {
    addFiltersToGui();

    //let url = "testdata.json"
    let url = "http://overpass-api.de/api/interpreter?data=[out:json];(node(area:3602778914)[highway=bus_stop]);out;";


    busStopProvider = new BusStopProvider(url, () => { updateBusStopsOnMap(); updateCharts(); });

    initMap();
    addClickHandlersForDistributionOnMap();
    addClickhandlersToFilters();
    addClickhandlerToQuickCheck();
    updateCharts();
};

function addClickHandlersForDistributionOnMap() {
    jQuery("[data-show-distribution-on-map]").on("change", onShowDistributionOnMapChange);
}

function onShowDistributionOnMapChange() {
    jQuery("[data-show-distribution-on-map]:not([data-show-distribution-on-map='" + jQuery(this).attr("data-show-distribution-on-map") + "'])").prop("checked", false);
    updateBusStopsOnMap();
}

function getCurrentDistributionKey() {
    return jQuery("[data-show-distribution-on-map]:checked").attr("data-show-distribution-on-map");
}

function updateCharts() {
    let busStops = busStopProvider.busStops;
    jQuery("[data-chart]").each(function () {
        let key = jQuery(this).attr("data-chart");
        let distribution = {
            "yes": 0,
            "no": 0,
            "unknown": 0
        }
        for (var i = 0; i < busStops.length; i++) {
            let busStop = busStops[i];
            distribution[busStop.properties[key]]++;
        }

        let values = [distribution.yes, distribution.no, distribution.unknown];
        jQuery(this).sparkline(values, {
            type: 'pie',
            tooltipContainer: document.getElementById('filter'),
            tooltipFormat: '{{offset:offset}} {{value}}',
            tooltipValueLookups: {
                'offset': {
                    0: 'ja',
                    1: 'nein',
                    2: 'unklar',
                }
            },
            sliceColors: ["#71ae26", "#d13d29", "#ccc"]
        });
    })
}

function formatPopup(busStop: BusStop): string {
    let iframe = "";
    if (busStop.informations.id != null) iframe = `<iframe src='http://www.swtue.de/abfahrt/?halt=${busStop.informations.id}'></iframe>`;

    let table = "<table>";
    table += Object.keys(filters).map(k => formatTableRowInPopup(busStop, k)).join("");
    if (busStop.informations.operator != null) table += `<tr><td>Betreiber</td><td>${busStop.informations.operator}</td></tr>`;
    if (busStop.informations.lines != null) table += `<tr><td>Linien</td><td>${formatMultivalue(busStop.informations.lines)}</td></tr>`;
    table += "</table>";

    return `<div class='bus-stop-popup'><h1>${busStop.name}</h1>${table}${iframe}</div>`;
}

function formatMultivalue(val) {
    val = replaceAll(';', ', ', val);
    val = replaceAll('  ', ' ', val);
    return val;
}

function replaceAll(find, replace, str) {
    return str.replace(new RegExp(find, 'g'), replace);
}

function formatTableRowInPopup(busStop: BusStop, key: string): string {
    let yesNoUnknownTranslation = {
        "yes": "ja",
        "no": "nein",
        "unknown": "unklar"
    }

    let yesNoUnknownStatusIndictator = {
        "yes": "<span class='indicator yes'></span>",
        "no": "<span class='indicator no'></span>",
        "unknown": "<span class='indicator unknown'></span>"
    }

    let value = busStop.properties[key];

    return `<tr><td>${filters[key]}</td><td>${yesNoUnknownStatusIndictator[value]}${yesNoUnknownTranslation[value]}</td></tr>`;
}

function addClickhandlerToQuickCheck() {
    jQuery("#uncheck-all").on("click", () => setCheckToAll(false));
    jQuery("#check-all").on("click", () => setCheckToAll(true));
}

function setCheckToAll(value: boolean): void {
    jQuery("[data-filter]").prop("checked", value);
    updateBusStopsOnMap();
}

function initMap() {
    map = L.map("map", { zoomControl: false }).setView([48.52243, 9.05462], 14);

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
        maxZoom: 19,
    }).addTo(map);

    busStopLayer = L.featureGroup();
    busStopLayer.addTo(map);
}

function addBusStopsToMap(busStops: BusStop[]): void {
    busStopLayer.clearLayers();
    let currentDistributionKey = getCurrentDistributionKey();

    let iconColorMap = {
        "yes": "green",
        "no": "red",
        "unknown": "gray",
    }

    for (let i in busStops) {
        let busStop = busStops[i];

        let color = "cadetblue";

        if (currentDistributionKey != null) {
            color = iconColorMap[busStop.properties[currentDistributionKey]];
        }

        var icon = L.AwesomeMarkers.icon({
            icon: 'bus',
            prefix: 'fa',
            markerColor: color,
            iconColor: 'white',
            spin: false
        });

        let marker = L.marker([busStop.lat, busStop.lng], { icon: icon }).bindPopup(formatPopup(busStop));

        marker.addTo(busStopLayer);
    }
}

let filters = {
    "wastebin": "Mülleimer",
    "tactilePaving": "ertastbares Pflaster",
    "wheelchairCompatible": "Rollstuhl-tauglich",
    "shelter": "überdacht",
    "bench": "Sitzbank",
    "passengerInformationDisplay": "Ankunftsanzeige"
};

function addFiltersToGui() {  
    let html = "";
    for (var filter in filters) {
        html += formatFilter(filter, filters[filter]);
    }

    let table = jQuery("#filter table tbody");
    table.html(html);
}

function formatFilter(name, caption) {
    return "<tr><td class='filter-caption'>" + caption + "</td>"
        + formatFilterOption(name, caption, "yes")
        + formatFilterOption(name, caption, "no")
        + formatFilterOption(name, caption, "unknown")
        + "<td class='chart' data-chart='" + name + "'></td><td class='show-distribution-on-map'><input type='checkbox' id='show-distribution-on-map-" + name + "' name='show-distribution-on-map' data-show-distribution-on-map='" + name + "'></td></tr>";
}

function formatFilterOption(name, caption, val) {
    return `<td class='filter-option'><input type='checkbox' id='${name}-${val}' checked='checked' data-filter='${name}' data-filter-value='${val}'><label for='${name}-yes'></label></td>`;
}

function addClickhandlersToFilters() {
    jQuery("[data-filter]").on("change", onFilterClicked);
}

function onFilterClicked() {
    updateBusStopsOnMap();
}

function updateBusStopsOnMap() {
    addBusStopsToMap(filterBusStops(busStopProvider.busStops));
}

interface Filter {
    key: string;
    value: string;
}

function getFilters(): Filter[] {
    let filters: Filter[] = [];

    jQuery("[data-filter]").each(function () {
        let filter = { key: jQuery(this).attr("data-filter"), value: jQuery(this).attr("data-filter-value") };
        if (jQuery(this)[0].checked) {
            filters.push(filter);
        }
    })

    return filters;
}

function filterBusStops(busStops: BusStop[]): BusStop[] {
    let filteredBusStops: BusStop[] = [];
    let filters = getFilters();

    for (let i = 0; i < busStops.length; i++) {
        let busStop = busStops[i];
        for (let j = 0; j < filters.length; j++) {
            if (busStopFulfilsFilter(busStop, filters[j])) {
                filteredBusStops.push(busStop);
                break;
            }
        }
    }

    return filteredBusStops;
}

function busStopFulfilsFilter(busStop: BusStop, filter: Filter): boolean {
    return busStop.properties[filter.key] == filter.value;
}