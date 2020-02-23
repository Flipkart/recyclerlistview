import * as React from "react";
import { Dimension } from "../dependencies/LayoutProvider";
import BaseScrollView, { ScrollEvent, ScrollViewDefaultProps } from "./BaseScrollView";

export interface ScrollComponentProps {
    onSizeChanged: (dimensions: Dimension, forceFullRender?: boolean) => void;
    onScroll: (offsetX: number, offsetY: number, rawEvent: ScrollEvent) => void;
    contentHeight: number;
    contentWidth: number;
    renderAheadOffset: number;
    canChangeSize?: boolean;
    externalScrollView?: { new(props: ScrollViewDefaultProps): BaseScrollView };
    isHorizontal?: boolean;
    renderFooter?: () => JSX.Element | JSX.Element[] | null;
    scrollThrottle?: number;
    useWindowScroll?: boolean;
    onLayout?: any;
    renderContentContainer?: (props?: object, children?: React.ReactNode) => React.ReactNode | null;
    initialEstimatedSize?: Dimension;
}
export default abstract class BaseScrollComponent extends React.Component<ScrollComponentProps, {}> {
    public abstract scrollTo(x: number, y: number, animate: boolean): void;
}
