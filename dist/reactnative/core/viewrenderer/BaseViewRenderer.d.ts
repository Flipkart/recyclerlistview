/// <reference types="react" />
import * as React from "react";
import { Dimension, BaseLayoutProvider } from "../dependencies/LayoutProvider";
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
    styleOverrides?: object;
    forceNonDeterministicRendering?: boolean;
    isHorizontal?: boolean;
    extendedState?: object;
    layoutProvider?: BaseLayoutProvider;
}
export default abstract class BaseViewRenderer<T> extends React.Component<ViewRendererProps<T>, {}> {
    protected animatorStyleOverrides: object | undefined;
    shouldComponentUpdate(newProps: ViewRendererProps<any>): boolean;
    componentDidMount(): void;
    componentWillMount(): void;
    componentWillUnmount(): void;
    protected abstract getRef(): object | null;
    protected renderChild(): JSX.Element | JSX.Element[] | null;
}
