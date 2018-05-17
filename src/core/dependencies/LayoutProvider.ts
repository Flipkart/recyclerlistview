import { Layout, WrapGridLayoutManager, LayoutManager } from "../layoutmanager/LayoutManager";

/**
 * Created by talha.naqvi on 05/04/17.
 * You can create a new instance or inherit and override default methods
 * You may need access to data provider here, it might make sense to pass a function which lets you fetch the latest data provider
 * Why only indexes? The answer is to allow data virtualization in the future. Since layouts are accessed much before the actual render assuming having all
 * data upfront will only limit possibilites in the future.
 *
 * By design LayoutProvider forces you to think in terms of view types. What that means is that you'll always be dealing with a finite set of view templates
 * with deterministic dimensions. We want to eliminate unnecessary re-layouts that happen when height, by mistake, is not taken into consideration.
 * This patters ensures that your scrolling is as smooth as it gets. You can always increase the number of types to handle non deterministic scenarios.
 *
 * NOTE: You can also implement features such as ListView/GridView switch by simple changing your layout provider.
 */

export abstract class BaseLayoutProvider {
    //Return your layout manager
    public abstract newLayoutManager(renderWindowSize: Dimension, isHorizontal?: boolean, cachedLayouts?: Layout[]): LayoutManager;

    //Given an index a provider is expected to return a view type which used to recycling choices
    public abstract getLayoutTypeForIndex(index: number): string | number;

    //Set the computed layout for an item, if there is a mismatch with actual your layout manager will be notified.
    public abstract setComputedLayout(type: string | number, dimension: Dimension, index: number): void;
}

export class LayoutProvider extends BaseLayoutProvider {

    private _getLayoutTypeForIndex: (index: number) => string | number;
    private _setLayoutForType: (type: string | number, dim: Dimension, index: number) => void;

    constructor(getLayoutTypeForIndex: (index: number) => string | number,
                setLayoutForType: (type: string | number, dim: Dimension, index: number) => void) {
        super();
        this._getLayoutTypeForIndex = getLayoutTypeForIndex;
        this._setLayoutForType = setLayoutForType;
    }

    public newLayoutManager(renderWindowSize: Dimension, isHorizontal?: boolean, cachedLayouts?: Layout[]): LayoutManager {
        return new WrapGridLayoutManager(this, renderWindowSize, isHorizontal, cachedLayouts);
    }

    //Provide a type for index, something which identifies the template of view about to load
    public getLayoutTypeForIndex(index: number): string | number {
        return this._getLayoutTypeForIndex(index);
    }

    //Given a type and dimension set the dimension values on given dimension object
    //You can also get index here if you add an extra argument but we don't recommend using it.
    public setComputedLayout(type: string | number, dimension: Dimension, index: number): void {
        return this._setLayoutForType(type, dimension, index);
    }
}

export interface Dimension {
    height: number;
    width: number;
}
