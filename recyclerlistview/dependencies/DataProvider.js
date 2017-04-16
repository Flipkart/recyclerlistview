class DataProvider {
    constructor(rowHasChanged) {
        this._rowHasChanged = rowHasChanged;
        this._firstIndexToProcess = 0;
        this._size = 0;
    }

    getDataForIndex(index) {
        return this._data[index];
    }

    getSize() {
        return this._size;
    }

    cloneWithRows(newData) {
        let dp = new DataProvider(this._rowHasChanged);
        let newSize = newData.length;
        let iterCount = Math.min(this._size, newSize);
        let i = 0;
        for (i = 0; i < iterCount; i++) {
            if (this._rowHasChanged(this._data[i], newData[i])) {
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