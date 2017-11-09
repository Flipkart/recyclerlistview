import * as React from "react";
import { Dimension } from "../dependencies/LayoutProvider";
import { CSSProperties } from "react";

export interface ScrollViewDefaultProps {
    onScroll: (event: ScrollEvent) => void,
    onSizeChanged: (dimensions: Dimension) => void,
    horizontal: boolean,
    canChangeSize: boolean,
    style?: CSSProperties | null,
}
export interface ScrollEvent {
    nativeEvent: {
        contentOffset: {
            x: number,
            y: number
        },
        layoutMeasurement?: Dimension,
        contentSize?: Dimension
    }
}
export default abstract class BaseScrollView<T extends ScrollViewDefaultProps> extends React.Component<T, {}> {
    public abstract scrollTo(scrollInput: { x: number, y: number, animated: boolean }): void;
}