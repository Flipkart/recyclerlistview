/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
class DataProvider {
    constructor(rowHasChanged) {
        if (rowHasChanged) {
            this.rowHasChanged = rowHasChanged;
        }
        this._firstIndexToProcess = 0;
        this._size = 0;
    }

    getDataForIndex(index) {
        return this._data[index];
    }

    getSize() {
        return this._size;
    }

    //No need to override this one
    cloneWithRows(newData) {
        let dp = new DataProvider(this.rowHasChanged);
        let newSize = newData.length;
        let iterCount = Math.min(this._size, newSize);
        let i = 0;
        for (i = 0; i < iterCount; i++) {
            if (this.rowHasChanged(this._data[i], newData[i])) {
                break;
            }
        }
        dp._firstIndexToProcess = i;
        dp._data = newData;
        dp._size = newSize;
        return dp;
    }
}

export
default
DataProvider;