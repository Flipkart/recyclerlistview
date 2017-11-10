import * as React from "react";
import { Dimension } from "../dependencies/LayoutProvider";
import BaseScrollView, { ScrollEvent } from "./BaseScrollView";

export interface ScrollComponentProps {
    canChangeSize: boolean;
    contentHeight: number;
    contentWidth: number;
    externalScrollView: BaseScrollView;
    onSizeChanged: (dimensions: Dimension) => void;
    onScroll: (offsetX: number, offsetY: number, rawEvent: ScrollEvent) => void;
    isHorizontal: boolean;
    renderFooter: () => JSX.Element;
    scrollThrottle: number;
    distanceFromWindow: number;
    useWindowScroll: boolean;
}
export default abstract class BaseScrollComponent extends React.Component<ScrollComponentProps, {}> {
    public abstract scrollTo(x: number, y: number, animate: boolean): void;
}
