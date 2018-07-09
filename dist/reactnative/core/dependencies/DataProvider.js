"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts_object_utils_1 = require("ts-object-utils");
/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
var DataProvider = /** @class */ (function () {
    function DataProvider(rowHasChanged, getStableId) {
        this._firstIndexToProcess = 0;
        this._size = 0;
        this._data = [];
        this._hasStableIds = false;
        this._requiresDataChangeHandling = false;
        this.rowHasChanged = rowHasChanged;
        if (getStableId) {
            this.getStableId = getStableId;
            this._hasStableIds = true;
        }
        else {
            this.getStableId = function (index) { return index.toString(); };
        }
    }
    DataProvider.prototype.getDataForIndex = function (index) {
        return this._data[index];
    };
    DataProvider.prototype.getAllData = function () {
        return this._data;
    };
    DataProvider.prototype.getSize = function () {
        return this._size;
    };
    DataProvider.prototype.hasStableIds = function () {
        return this._hasStableIds;
    };
    DataProvider.prototype.requiresDataChangeHandling = function () {
        return this._requiresDataChangeHandling;
    };
    DataProvider.prototype.getFirstIndexToProcessInternal = function () {
        return this._firstIndexToProcess;
    };
    //No need to override this one
    //If you already know the first row where rowHasChanged will be false pass it upfront to avoid loop
    DataProvider.prototype.cloneWithRows = function (newData, firstModifiedIndex) {
        var dp = new DataProvider(this.rowHasChanged, this.getStableId);
        var newSize = newData.length;
        var iterCount = Math.min(this._size, newSize);
        if (ts_object_utils_1.ObjectUtil.isNullOrUndefined(firstModifiedIndex)) {
            var i = 0;
            for (i = 0; i < iterCount; i++) {
                if (this.rowHasChanged(this._data[i], newData[i])) {
                    break;
                }
            }
            dp._firstIndexToProcess = i;
        }
        else {
            dp._firstIndexToProcess = Math.max(Math.min(firstModifiedIndex, this._data.length), 0);
        }
        if (dp._firstIndexToProcess !== this._data.length) {
            dp._requiresDataChangeHandling = true;
        }
        dp._data = newData;
        dp._size = newSize;
        return dp;
    };
    return DataProvider;
}());
exports.default = DataProvider;
//# sourceMappingURL=DataProvider.js.map