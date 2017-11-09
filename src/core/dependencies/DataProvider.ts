/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
export default class DataProvider<T> {

    public rowHasChanged: (r1: T, r2: T) => boolean;

    private _firstIndexToProcess: number;
    private _size: number;
    private _data: T[];

    constructor(rowHasChanged: (r1: T, r2: T) => boolean) {
        if (rowHasChanged) {
            this.rowHasChanged = rowHasChanged;
        }
        this._firstIndexToProcess = 0;
        this._size = 0;
    }

    public getDataForIndex(index: number): T {
        return this._data[index];
    }

    public getSize(): number {
        return this._size;
    }

    public getFirstIndexToProcessInternal() {
        return this._firstIndexToProcess;
    }

    //No need to override this one
    public cloneWithRows(newData: T[]) {
        const dp = new DataProvider(this.rowHasChanged);
        const newSize = newData.length;
        const iterCount = Math.min(this._size, newSize);
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
