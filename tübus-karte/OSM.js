var OsmElementType;
(function (OsmElementType) {
    OsmElementType["node"] = "node";
})(OsmElementType || (OsmElementType = {}));
class OverpassController {
    constructor(overpassResponse) {
        this.overpassResponse = overpassResponse;
    }
    IsNode(element) {
        return element.type == OsmElementType.node;
    }
    get Nodes() {
        return this.overpassResponse.elements.filter(this.IsNode);
    }
}
//# sourceMappingURL=OSM.js.map