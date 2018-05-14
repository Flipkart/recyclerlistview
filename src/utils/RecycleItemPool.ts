/***
 * Recycle pool for maintaining recyclable items, supports segregation by type as well.
 * Availability check, add/remove etc are all O(1), uses two maps to achieve constant time operation
 */

interface PseudoSet {[key: string]: string; }
interface NullablePseudoSet {[key: string]: string|null; }

export default class RecycleItemPool {
    private _recyclableObjectMap: { [key: string]: NullablePseudoSet };
    private _availabilitySet: PseudoSet;

    constructor() {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    }

    public putRecycledObject(objectType: string | number, object: string): void  {
        objectType = this._stringify(objectType);
        const objectSet = this._getRelevantSet(objectType);
        if (!this._availabilitySet[object]) {
            objectSet[object] = null;
            this._availabilitySet[object] = objectType;
        }
    }

    public getRecycledObject(objectType: string | number): string | undefined {
        objectType = this._stringify(objectType);
        const objectSet = this._getRelevantSet(objectType);
        let recycledObject;
        for (const property in objectSet) {
            if (objectSet.hasOwnProperty(property)) {
                recycledObject = property;
                break;
            }
        }

        if (recycledObject) {
            delete objectSet[recycledObject];
            delete this._availabilitySet[recycledObject];
        }
        return recycledObject;
    }

    public removeFromPool(object: string): boolean  {
        if (this._availabilitySet[object]) {
            delete this._getRelevantSet(this._availabilitySet[object])[object];
            delete this._availabilitySet[object];
            return true;
        }
        return false;
    }

    public clearAll(): void  {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    }

    private _getRelevantSet(objectType: string): NullablePseudoSet {
        let objectSet = this._recyclableObjectMap[objectType];
        if (!objectSet) {
            objectSet = {};
            this._recyclableObjectMap[objectType] = objectSet;
        }
        return objectSet;
    }

    private _stringify(objectType: string | number): string {
        if (typeof objectType === "number") {
            objectType = objectType.toString();
        }
        return objectType;
    }
}
