import { ObjectUtil } from "ts-object-utils";

/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
export abstract class BaseDataProvider {
    public rowHasChanged: (r1: any, r2: any) => boolean;

    // In JS context make sure stable id is a string
    public getStableId: (index: number) => string;
    private _firstIndexToProcess: number = 0;
    private _lastIndexToProcess: number = 0;
    private _size: number = 0;
    private _data: any[] = [];
    private _hasStableIds = false;
    private _requiresDataChangeHandling = false;

    constructor(rowHasChanged: (r1: any, r2: any) => boolean, getStableId?: (index: number) => string) {
        this.rowHasChanged = rowHasChanged;
        if (getStableId) {
            this.getStableId = getStableId;
            this._hasStableIds = true;
        } else {
            this.getStableId = (index) => index.toString();
        }
    }

    public abstract newInstance(rowHasChanged: (r1: any, r2: any) => boolean, getStableId?: (index: number) => string): BaseDataProvider;

    public getDataForIndex(index: number): any {
        return this._data[index];
    }

    public getAllData(): any[] {
        return this._data;
    }

    public getSize(): number {
        return this._size;
    }

    public hasStableIds(): boolean {
        return this._hasStableIds;
    }

    public requiresDataChangeHandling(): boolean {
        return this._requiresDataChangeHandling;
    }

    public getFirstIndexToProcessInternal(): number {
        return this._firstIndexToProcess;
    }

    public getLastIndexToProcessInternal(): number {
        return this._lastIndexToProcess;
    }

    //No need to override this one`
    //If you already know the first row where rowHasChanged will be false pass it upfront to avoid loop
    public cloneWithRows(newData: any[], firstModifiedIndex: number = 0, lastModifiedIndex?: number): DataProvider {
        const dp = this.newInstance(this.rowHasChanged, this.getStableId);
        const newSize = newData.length;
        const iterCount = Math.min(this._size, newSize);
        if (!ObjectUtil.isNullOrUndefined(firstModifiedIndex) && !ObjectUtil.isNullOrUndefined(lastModifiedIndex)) {
            dp._firstIndexToProcess = Math.max(Math.min(firstModifiedIndex, this._data.length), 0);
            dp._lastIndexToProcess = Math.min(Math.max(firstModifiedIndex, lastModifiedIndex), this._data.length);
        } else if (ObjectUtil.isNullOrUndefined(firstModifiedIndex)) {
            const endIndex = lastModifiedIndex || iterCount;
            for (let i = 0; i < endIndex; i++) {
                if (this.rowHasChanged(this._data[i], newData[i])) {
                    break;
                }
                dp._firstIndexToProcess = i;
            }
            dp._lastIndexToProcess = endIndex;
        } else if (ObjectUtil.isNullOrUndefined(lastModifiedIndex)) {
            for (let i = iterCount; i > firstModifiedIndex; i--) {
                if (this.rowHasChanged(this._data[i], newData[i])) {
                    break;
                }
                dp._lastIndexToProcess = i;
            }
            dp._firstIndexToProcess = firstModifiedIndex;
        } else {
            let firstIndexToProcess = 0;
            let isFirstIndexFound = false;
            let lastIndexToProcess = newSize;
            for (let i = 0; i < iterCount; i++) {
                const rowHasChanged = this.rowHasChanged(this._data[i], newData[i]);
                if (!isFirstIndexFound && rowHasChanged) {
                    firstIndexToProcess = i;
                    isFirstIndexFound = true;
                }
                if (isFirstIndexFound && !rowHasChanged) {
                    lastIndexToProcess = i;
                    break;
                }
            }
            dp._firstIndexToProcess = firstIndexToProcess;
            dp._lastIndexToProcess = lastIndexToProcess;
        }

        if (dp._firstIndexToProcess !== this._data.length || dp._lastIndexToProcess !== 0) {
            dp._requiresDataChangeHandling = true;
        }
        dp._data = newData;
        dp._size = newSize;
        return dp;
    }
}

export default class DataProvider extends BaseDataProvider {
    public newInstance(rowHasChanged: (r1: any, r2: any) => boolean, getStableId?: ((index: number) => string) | undefined): BaseDataProvider {
        return new DataProvider(rowHasChanged, getStableId);
    }
}
