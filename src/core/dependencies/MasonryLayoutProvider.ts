import { BaseLayoutProvider, Dimension } from "./LayoutProvider";
import { Layout, LayoutManager } from "../layoutmanager/LayoutManager";
import {
    MasonryLayoutManager, GetTypeCallbackFn, SetDimensionCallbackFn,
} from "../layoutmanager/MasonryLayoutManager";

export class MasonryLayoutProvider extends BaseLayoutProvider {
    private numOfColumn: number;
    private getTypeCallback: GetTypeCallbackFn;
    private setDimensionCallback: SetDimensionCallbackFn;

    public constructor(
        numOfColumn: number,
        getTypeCallback: GetTypeCallbackFn,
        setDimensionCallback: SetDimensionCallbackFn,
    ) {
        super();
        this.numOfColumn = numOfColumn;
        this.getTypeCallback = getTypeCallback;
        this.setDimensionCallback = setDimensionCallback;
    }

    public newLayoutManager(
        renderWindowSize: Dimension,
        isHorizontal?: boolean | undefined,
        cachedLayouts?: Layout[] | undefined,
    ): LayoutManager {
        return new MasonryLayoutManager(
            renderWindowSize,
            this.numOfColumn,
            this.getTypeCallback,
            this.setDimensionCallback,
            isHorizontal,
            cachedLayouts,
        );
    }

    public getLayoutTypeForIndex(index: number): string | number {
        return this.getTypeCallback(index);
    }

    public checkDimensionDiscrepancy(
        dimension: Dimension,
        type: string | number,
        index: number,
    ): boolean {
        const dimension1 = dimension;
        const tempDim: Dimension = { height: 0, width: 0 };
        this.setDimensionCallback(type, tempDim, index);
        return (
            dimension1.height !== tempDim.height || dimension1.width !== tempDim.width
        );
    }
}
