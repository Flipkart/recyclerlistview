import { List } from "immutable";
import { ObjectUtil } from "ts-object-utils";

/***
 * You can create a new instance or inherit and override default methods
 * Allows access to data and size. Clone with rows creates a new data provider and let listview know where to calculate row layout from.
 */
export abstract class GenericDataProvider<T, K = keyof T> {
    public rowHasChanged: (r1: T, r2: T) => boolean;
    public getStableId: (index: number)  => string;  // In JS context make sure stable id is a string
    protected _data: K;                              // Require Init Data

    protected _firstIndexToProcess: number = 0;
    protected _size: number = 0;
    protected _hasStableIds = false;
    protected _requiresDataChangeHandling = false;

    constructor(initData: K,
                rowHasChanged: (r1: T, r2: T) => boolean,
                getStableId?: (index: number) => string ) {
        this._data         = initData;
        this.rowHasChanged = rowHasChanged;
        if (getStableId) {
            this.getStableId   = getStableId;
            this._hasStableIds = true;
        } else {
            this.getStableId = (index) => index.toString();
        }
    }

    public abstract newInstance(
        rowHasChanged: (r1: T, r2: T) => boolean,
        getStableId?: (index: number) => string    ): GenericDataProvider<T, K>;
    public abstract getDataForIndex(index: number): T | undefined;
    public abstract cloneWithRows(newData: K,
                                  firstModifiedIndex?: number): DataProvider | ListDataProvider;

    public getAllData(): K {
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
}

export abstract class BaseDataProvider extends GenericDataProvider<any, any[]> {
    constructor(rowHasChanged: (r1: any, r2: any) => boolean,
                getStableId?: (index: number)     => string) {
        super([], rowHasChanged, getStableId);
    }

    public abstract newInstance(
        rowHasChanged: (r1: any, r2: any) => boolean,
        getStableId?: (index: number) => string): BaseDataProvider;

    public getDataForIndex(index: number): any | undefined {
        return this._data[index];
    }

    //No need to override this one
    //If you already know the first row where rowHasChanged will be false pass it upfront to avoid loop
    public cloneWithRows(newData: any[], firstModifiedIndex?: number): DataProvider {
        const dp      = this.newInstance(this.rowHasChanged, this.getStableId);
        const newSize = newData.length;

        dp._firstIndexToProcess = ObjectUtil.isNullOrUndefined(firstModifiedIndex)
                                ? this.getFirstIndexChange(newData, newSize)
                                : Math.max(Math.min(firstModifiedIndex, this._data.length), 0);

        if (dp._firstIndexToProcess !== this._data.length) {
            dp._requiresDataChangeHandling = true;
        }
        dp._data = newData;
        dp._size = newSize;
        return dp;
    }

    private getFirstIndexChange(newData: any[], newSize: number): number {
        const iterCount = Math.min(this._size, newSize);
        let i = 0;
        for (i = 0; i < iterCount; i++) {
            if (this.rowHasChanged(this._data[i], newData[i])) {
                break;
            }
        }
        return i;
    }
}

export abstract class ListBaseDataProvider extends GenericDataProvider<any, List<any>> {
    constructor(rowHasChanged: (r1: any, r2: any ) => boolean,
                getStableId?: (index: number)      => string) {
        super(List<any>([]), rowHasChanged, getStableId);
    }

    public abstract newInstance(
      rowHasChanged: (r1: any, r2: any)  => boolean,
      getStableId?: (index: number)      => string): ListBaseDataProvider;

    public getDataForIndex(index: number): any | undefined {
      return this._data.get(index);
    }

    //No need to override this one
    //If you already know the first row where rowHasChanged will be false pass it upfront to avoid loop
    public cloneWithRows(newData: List<any>, firstModifiedIndex?: number): ListDataProvider {
      const dp        = this.newInstance(this.rowHasChanged, this.getStableId);
      const newSize   = newData.size;

      dp._firstIndexToProcess = ObjectUtil.isNullOrUndefined(firstModifiedIndex)
                              ? this.getFirstIndexChange(newData, newSize)
                              : Math.max(Math.min(firstModifiedIndex, this._data.size), 0);

      if (dp._firstIndexToProcess !== this._data.size) {
        dp._requiresDataChangeHandling = true;
      }
      dp._data = newData;
      dp._size = newSize;
      return dp;
    }

    private getFirstIndexChange(newData: List<any>, newSize: number): number {
        if (this._data.equals(newData)) {
            return this._size;
        }

        if (this._size > newSize) {
            const sizeData = newData.setSize(this._size);
            return (this._data as List<any>)
                .findIndex((value, index) => this.rowHasChanged(value, sizeData.get(index)!));
        } else {
            const sizeData = this._data.setSize(newSize);
            return (sizeData as List<any>)
                .findIndex((value, index) => this.rowHasChanged(value, newData.get(index )!));
        }
    }
  }

export default class DataProvider extends BaseDataProvider {
    public newInstance(rowHasChanged: (r1: any, r2: any) => boolean,
                       getStableId?: ((index: number)    => string) | undefined): BaseDataProvider {
                           return new DataProvider(rowHasChanged, getStableId);
                       }
}

export class ListDataProvider extends ListBaseDataProvider {
    public newInstance(rowHasChanged: (r1: any, r2: any)  => boolean,
                       getStableId?: ((index: number) => string) | undefined): ListBaseDataProvider {
                           return new ListDataProvider(rowHasChanged, getStableId);
                       }
}
