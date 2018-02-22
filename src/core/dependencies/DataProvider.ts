/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
export default class DataProvider {
    public rowHasChanged: (r1: any, r2: any) => boolean;
    private _firstIndexToProcess: number = 0;
    private _size: number = 0;
    private _data: any[] = [];

    constructor(rowHasChanged: (r1: any, r2: any) => boolean) {
        this.rowHasChanged = rowHasChanged;
    }
    public getDataForIndex(index: number): any {
        return this._data[index];
    }

    public getAllData(): any[] {
        return this._data;
    }

    public getSize(): number {
        return this._size;
    }

    public getFirstIndexToProcessInternal(): number {
        return this._firstIndexToProcess;
    }

    //No need to override this one
    public cloneWithRows(newData: any[]): DataProvider {
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
