//Warning: works only on string types
class RecycleItemPool {
    constructor() {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    }

    _getRelevantSet(objectType) {
        let objectSet = this._recyclableObjectMap[objectType];
        if (!objectSet) {
            objectSet = {};
            this._recyclableObjectMap[objectType] = objectSet;
        }
        return objectSet;
    }

    putRecycledObject(objectType, object) {
        let objectSet = this._getRelevantSet(objectType);
        if (!this._isPresent(this._availabilitySet[object])) {
            objectSet[object] = null;
            this._availabilitySet[object] = objectType;
        }
    }


    getRecycledObject(objectType) {
        let objectSet = this._getRelevantSet(objectType);
        let recycledObject = null;
        for (let property in objectSet) {
            if (objectSet.hasOwnProperty(property)) {
                recycledObject = property;
                break;
            }
        }

        if (this._isPresent(recycledObject)) {
            delete objectSet[recycledObject];
            delete this._availabilitySet[recycledObject];
        }
        return recycledObject;
    }

    removeFromPool(object) {
        if (this._isPresent(this._availabilitySet[object])) {
            delete this._getRelevantSet(this._availabilitySet[object])[object];
            delete this._availabilitySet[object];
        }
    }

    clearAll() {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    }

    _isPresent(value) {
        return value || value === 0;
    }

}
export default RecycleItemPool;