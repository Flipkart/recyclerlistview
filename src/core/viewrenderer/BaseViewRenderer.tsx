import * as React from 'react';
import { Dimension } from "../dependencies/LayoutProvider";

/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
export interface ViewRendererProps<T> {
    x: number,
    y: number,
    height: number,
    width: number,
    childRenderer: (type: string | number, data: T, index: number) => JSX.Element,
    layoutType: string | number,
    dataHasChanged: (r1: T, r2: T) => boolean,
    onSizeChanged: (dim: Dimension, index: number) => void,
    data: any,
    index: number,
    forceNonDeterministicRendering?: boolean,
    isHorizontal?: boolean
}
export default class BaseViewRenderer<T> extends React.Component<ViewRendererProps<T>, {}> {

}
