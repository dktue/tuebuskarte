interface BusStop {
    name: string;
    lat: number;
    lng: number;

    informations: {
        lines: string;
        operator: string;
        id: string;
    }

    properties: {
        wastebin: YesNoUnknown;
        tactilePaving: YesNoUnknown;
        wheelchairCompatible: YesNoUnknown;
        shelter: YesNoUnknown;
        bench: YesNoUnknown;
        passengerInformationDisplay: YesNoUnknown;
    }
}

enum YesNoUnknown {
    yes = "yes",
    no = "no",
    unknown = "unknown"
}

class BusStopProvider {
    public busStops: BusStop[];
    private callback: () => void;

    constructor(url: string, callback?: () => void) {
        this.callback = callback;
        let self = this;
        fetch(url).then(response => response.json()).then(x => self.onBusStopsDownloaded(x));
    }

    onBusStopsDownloaded(overpassResponse: OverpassResponse) {
        let self = this;
        let overpassController = new OverpassController(overpassResponse);
        this.busStops = overpassController.Nodes.map(x => self.createBusStopFromOsm(x));

        this.busStops = this.busStops.filter(b => b.informations.operator == "TüBus");

        if (this.callback != null) this.callback();
    }

    createBusStopFromOsm(element: OsmNodeElement): BusStop {
        let t = element.tags;

        return {
            name: t["name"],
            lat: element.lat,
            lng: element.lon,

            informations: {
                operator: t["operator"],
                lines: t["lines"],
                id: t["ref"]
            },

            properties: {
                bench: this.getYesNoUnknownFromTagValue(t["bench"]),
                shelter: this.getYesNoUnknownFromTagValue(t["shelter"]),
                tactilePaving: this.getYesNoUnknownFromTagValue(t["tactile_paving"]),
                wastebin: this.getYesNoUnknownFromTagValue(t["bin"]),
                wheelchairCompatible: this.getYesNoUnknownFromTagValue(t["wheelchair"]),
                passengerInformationDisplay: this.getYesNoUnknownFromTagValue(t["passenger_information_display"])
            }
        };
    }

    getYesNoUnknownFromTagValue(tagValue: string): YesNoUnknown {
        if (tagValue == undefined) return YesNoUnknown.unknown;

        if (tagValue == "yes") return YesNoUnknown.yes;
        if (tagValue == "no") return YesNoUnknown.no;
        return YesNoUnknown.unknown;
    }
}