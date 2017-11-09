import * as React from "react";
import { Dimension } from "../dependencies/LayoutProvider";
import { ScrollEvent } from "./BaseScrollView";

export interface ScrollComponentProps {
    contentHeight: number,
    contentWidth: number,
    onSizeChanged: (dimensions: Dimension) => void,
    onScroll: (offsetX: number, offsetY: number, rawEvent: ScrollEvent) => void,
    isHorizontal: boolean,
    renderFooter: () => JSX.Element,
    scrollThrottle: number,
    canChangeSize: boolean,
    distanceFromWindow: number,
    useWindowScroll: boolean,
}
export default abstract class BaseScrollComponent extends React.Component<ScrollComponentProps, {}> {
    public abstract scrollTo(x: number, y: number, animate: boolean): void;
}