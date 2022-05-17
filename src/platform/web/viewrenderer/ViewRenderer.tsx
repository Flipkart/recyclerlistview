import * as React from "react";
import { CSSProperties } from "react";
import { LayoutChangeEvent, View, ViewProperties, ViewStyle } from "react-native";
import { Dimension } from "../../../core/dependencies/LayoutProvider";
import BaseViewRenderer, { ViewRendererProps } from "../../../core/viewrenderer/BaseViewRenderer";

interface RLVHTMLDivElement extends HTMLDivElement {
    clientHeight: number;
    clientWidth: number;
}

/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
export default class ViewRenderer extends BaseViewRenderer<any> {
    private _dim: Dimension = { width: 0, height: 0 };
    private _viewRef: React.Component<ViewProperties, React.ComponentState> | RLVHTMLDivElement | null = null;

    public componentDidMount(): void {
        if (super.componentDidMount) {
            super.componentDidMount();
        }
        this._checkSizeChange();
    }

    public componentDidUpdate(): void {
        this._checkSizeChange();
    }

    public renderCompat(): JSX.Element {
        const style: CSSProperties = this.props.forceNonDeterministicRendering
            ? {
                transform: this._getTransform(),
                WebkitTransform: this._getTransform(),
                ...styles.baseViewStyle,
                ...this.props.styleOverrides,
                ...this.animatorStyleOverrides,
            }
            : {
                height: this.props.height,
                overflow: "hidden",
                width: this.props.width,
                transform: this._getTransform(),
                WebkitTransform: this._getTransform(),
                ...styles.baseViewStyle,
                ...this.props.styleOverrides,
                ...this.animatorStyleOverrides,
            };
        return (
            <View ref={this._setRef} style={style as ViewStyle} onLayout={this._onLayout}>
                {this.renderChild()}
            </View>
        );
    }

    protected getRef(): object | null {
        return this._viewRef;
    }
    private _setRef = (view: React.Component<ViewProperties, React.ComponentState> | RLVHTMLDivElement | null): void => {
        this._viewRef = view;
    }
    private _getTransform(): string {
        return "translate(" + this.props.x + "px," + this.props.y + "px)";
    }

    private _checkSizeChange(): void {
        if (this.props.forceNonDeterministicRendering && this.props.onSizeChanged) {
            const mainDiv = this._viewRef;
            if (mainDiv) {
                if ("clientWidth" in mainDiv) {
                    this._dim.width = mainDiv.clientWidth;
                }
                if ("clientHeight" in mainDiv) {
                    this._dim.height = mainDiv.clientHeight;
                }
                if (this.props.width !== this._dim.width || this.props.height !== this._dim.height) {
                    this.props.onSizeChanged(this._dim, this.props.index);
                }
            }
        }
        this._onItemRendered();
    }

    private _onItemRendered(): void {
        if (this.props.onItemLayout) {
            this.props.onItemLayout(this.props.index);
        }
    }

    private _onLayout = (event: LayoutChangeEvent): void => {
        //Preventing layout thrashing in super fast scrolls where RN messes up onLayout event
        const xDiff = Math.abs(this.props.x - event.nativeEvent.layout.x);
        const yDiff = Math.abs(this.props.y - event.nativeEvent.layout.y);
        if (xDiff < 1 && yDiff < 1 &&
            (this.props.height !== event.nativeEvent.layout.height ||
                this.props.width !== event.nativeEvent.layout.width)) {
            this._dim.height = event.nativeEvent.layout.height;
            this._dim.width = event.nativeEvent.layout.width;
            if (this.props.onSizeChanged) {
                this.props.onSizeChanged(this._dim, this.props.index);
            }
        }

        if (this.props.onItemLayout) {
            this.props.onItemLayout(this.props.index);
        }
    }
}

const styles: { [key: string]: CSSProperties } = {
    baseViewStyle: {
        alignItems: "stretch",
        borderWidth: 0,
        borderStyle: "solid",
        boxSizing: "border-box",
        display: "flex",
        margin: 0,
        padding: 0,
        position: "absolute",
        minWidth: 0,
        left: 0,
        top: 0,
    },
};
