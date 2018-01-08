import * as React from "react";
import LayoutProvider, { Dimension } from "../dependencies/LayoutProvider";

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
    forceNonDeterministicRendering?: boolean;
    isHorizontal?: boolean;
    extendedState?: object;
    layoutProvider?: LayoutProvider;
}
export default class BaseViewRenderer<T> extends React.Component<ViewRendererProps<T>, {}> {
    public shouldComponentUpdate(newProps: ViewRendererProps<any>): boolean {
        return (
            this.props.x !== newProps.x ||
            this.props.y !== newProps.y ||
            this.props.width !== newProps.width ||
            this.props.height !== newProps.height ||
            this.props.layoutProvider !== newProps.layoutProvider ||
            this.props.extendedState !== newProps.extendedState ||
            (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data))
        );
    }
    protected renderChild(): JSX.Element | JSX.Element[] | null {
        return this.props.childRenderer(this.props.layoutType, this.props.data, this.props.index, this.props.extendedState);
    }
}
