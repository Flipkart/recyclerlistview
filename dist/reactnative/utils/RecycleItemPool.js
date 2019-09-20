"use strict";
/***
 * Recycle pool for maintaining recyclable items, supports segregation by type as well.
 * Availability check, add/remove etc are all O(1), uses two maps to achieve constant time operation
 */
Object.defineProperty(exports, "__esModule", { value: true });
var RecycleItemPool = /** @class */ (function () {
    function RecycleItemPool() {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    }
    RecycleItemPool.prototype.putRecycledObject = function (objectType, object) {
        objectType = this._stringify(objectType);
        var objectSet = this._getRelevantSet(objectType);
        if (!this._availabilitySet[object]) {
            objectSet[object] = null;
            this._availabilitySet[object] = objectType;
        }
    };
    RecycleItemPool.prototype.getRecycledObject = function (objectType) {
        objectType = this._stringify(objectType);
        var objectSet = this._getRelevantSet(objectType);
        var recycledObject;
        for (var property in objectSet) {
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
    };
    RecycleItemPool.prototype.removeFromPool = function (object) {
        if (this._availabilitySet[object]) {
            delete this._getRelevantSet(this._availabilitySet[object])[object];
            delete this._availabilitySet[object];
            return true;
        }
        return false;
    };
    RecycleItemPool.prototype.clearAll = function () {
        this._recyclableObjectMap = {};
        this._availabilitySet = {};
    };
    RecycleItemPool.prototype._getRelevantSet = function (objectType) {
        var objectSet = this._recyclableObjectMap[objectType];
        if (!objectSet) {
            objectSet = {};
            this._recyclableObjectMap[objectType] = objectSet;
        }
        return objectSet;
    };
    RecycleItemPool.prototype._stringify = function (objectType) {
        if (typeof objectType === "number") {
            objectType = objectType.toString();
        }
        return objectType;
    };
    return RecycleItemPool;
}());
exports.default = RecycleItemPool;
//# sourceMappingURL=RecycleItemPool.js.map