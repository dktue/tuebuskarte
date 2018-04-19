enum OsmElementType {
    node = "node"
}

interface OsmElement {
    id: number,
    type: OsmElementType,
    tags: [[string, string]]
}

interface OsmNodeElement extends OsmElement {
    lat: number;
    lon: number;
}

interface OverpassResponse {
    elements: OsmElement[]
}

class OverpassController {
    private overpassResponse: OverpassResponse;

    constructor(overpassResponse: OverpassResponse) {
        this.overpassResponse = overpassResponse;
    }

    private IsNode(element: OsmElement): boolean {
        return element.type == OsmElementType.node;
    }

    public get Nodes(): OsmNodeElement[] {
        return <OsmNodeElement[]>this.overpassResponse.elements.filter(this.IsNode);
    }
}