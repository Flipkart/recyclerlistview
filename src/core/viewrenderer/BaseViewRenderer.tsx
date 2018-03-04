import * as React from "react";
import LayoutProvider, { Dimension } from "../dependencies/LayoutProvider";
import ItemAnimator from "../ItemAnimator";

/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
export interface ViewRendererProps<T> {
    x: number;
    y: number;
    height: number;
    width: number;
    childRenderer: (type: string | number, data: T, index: number, extendedState?: object) => JSX.Element | JSX.Element[] | null;
    layoutType: string | number;
    dataHasChanged: (r1: T, r2: T) => boolean;
    onSizeChanged: (dim: Dimension, index: number) => void;
    data: any;
    index: number;
    itemAnimator: ItemAnimator;
    forceNonDeterministicRendering?: boolean;
    isHorizontal?: boolean;
    extendedState?: object;
    layoutProvider?: LayoutProvider;
}
export default abstract class BaseViewRenderer<T> extends React.Component<ViewRendererProps<T>, {}> {
    public shouldComponentUpdate(newProps: ViewRendererProps<any>): boolean {
        const hasMoved = this.props.x !== newProps.x || this.props.y !== newProps.y;

        const hasSizeChanged = !newProps.forceNonDeterministicRendering &&
            (this.props.width !== newProps.width || this.props.height !== newProps.height) ||
            this.props.layoutProvider !== newProps.layoutProvider;

        const hasExtendedStateChanged = this.props.extendedState !== newProps.extendedState;
        const hasDataChanged = (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data));
        let shouldUpdate = hasSizeChanged || hasDataChanged || hasExtendedStateChanged;

        if (shouldUpdate) {
            newProps.itemAnimator.animateWillUpdate(this.props.x, this.props.y, newProps.x, newProps.y, this.getRef() as object, newProps.index);
        } else if (hasMoved) {
            shouldUpdate = !newProps.itemAnimator.animateShift(this.props.x, this.props.y, newProps.x, newProps.y, this.getRef() as object, newProps.index);
        }
        return shouldUpdate;
    }
    public componentDidMount(): void {
        this.props.itemAnimator.animateDidMount(this.props.x, this.props.y, this.getRef() as object, this.props.index);
    }
    public componentWillMount(): void {
        this.props.itemAnimator.animateWillMount(this.props.x, this.props.y, this.props.index);
    }
    public componentWillUnmount(): void {
        this.props.itemAnimator.animateWillUnmount(this.props.x, this.props.y, this.getRef() as object, this.props.index);
    }
    protected abstract getRef(): object | null;
    protected renderChild(): JSX.Element | JSX.Element[] | null {
        return this.props.childRenderer(this.props.layoutType, this.props.data, this.props.index, this.props.extendedState);
    }
}
