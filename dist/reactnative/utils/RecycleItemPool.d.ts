export default class RecycleItemPool {
    private _recyclableObjectMap;
    private _availabilitySet;
    constructor();
    putRecycledObject(objectType: string | number, object: string): void;
    getRecycledObject(objectType: string | number): string | undefined;
    removeFromPool(object: string): boolean;
    clearAll(): void;
    private _getRelevantSet(objectType);
    private _stringify(objectType);
}
