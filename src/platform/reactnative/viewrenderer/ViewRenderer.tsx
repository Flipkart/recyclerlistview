import * as React from "react";
import { LayoutChangeEvent, View, ViewProperties } from "react-native";
import { Dimension } from "../../../core/dependencies/LayoutProvider";
import BaseViewRenderer, { ViewRendererProps } from "../../../core/viewrenderer/BaseViewRenderer";

/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
export default class ViewRenderer extends BaseViewRenderer<any> {
    private _dim: Dimension = { width: 0, height: 0 };
    private _viewRef: React.Component<ViewProperties, React.ComponentState> | null = null;
    private _hasLayouted: boolean = this.props.removeNonDeterministicShifting ? false : true;
    private _isVisible: boolean = this.props.removeNonDeterministicShifting ? false : true;
    public componentWillReceivePropsCompat(newProps: ViewRendererProps<any>): void {
        if (this.props.removeNonDeterministicShifting && newProps.index !== this.props.index) {
            this._hasLayouted = false;
            this._isVisible = false;
        }
    }

    public shouldComponentUpdate(newProps: ViewRendererProps<any>): boolean {
        const shouldUpdate = super.shouldComponentUpdate(newProps);
        if (this.props.removeNonDeterministicShifting && this._hasLayouted && !this._isVisible) {
            if (shouldUpdate) {
                this._isVisible = true;
            } else {
                this._makeVisible();
            }
        }
        return shouldUpdate;
    }

    public renderCompat(): JSX.Element {
        return this.props.forceNonDeterministicRendering ? (
            <View ref={this._setRef}
            onLayout={this._onLayout}
                style={{
                    flexDirection: this.props.isHorizontal ? "column" : "row",
                    left: this.props.x,
                    position: "absolute",
                    opacity: this._isVisible ? 1 : 0,
                    top: this.props.y,
                    ...this.props.styleOverrides,
                    ...this.animatorStyleOverrides,
                }}>
                {this.renderChild()}
            </View>
        ) : (
                <View ref={this._setRef}
                    style={{
                        left: this.props.x,
                        position: "absolute",
                        top: this.props.y,
                        height: this.props.height,
                        width: this.props.width,
                        ...this.props.styleOverrides,
                        ...this.animatorStyleOverrides,
                    }}>
                    {this.renderChild()}
                </View>
            );
    }

    protected getRef(): object | null {
        return this._viewRef;
    }

    private _setRef = (view: React.Component<ViewProperties, React.ComponentState> | null): void => {
        this._viewRef = view;
    }

    private _makeVisible(): void {
        const ref = (this._viewRef as object) as View;
        this._isVisible = true;
        ref.setNativeProps({
            opacity: 1,
        });
    }

    private _onLayout = (event: LayoutChangeEvent): void => {
        //Preventing layout thrashing in super fast scrolls where RN messes up onLayout event
        const xDiff = Math.abs(this.props.x - event.nativeEvent.layout.x);
        const yDiff = Math.abs(this.props.y - event.nativeEvent.layout.y);
        if (this.props.removeNonDeterministicShifting) {
            this._hasLayouted = true;
        }
        if (xDiff < 1 && yDiff < 1 &&
            (this.props.height !== event.nativeEvent.layout.height ||
                this.props.width !== event.nativeEvent.layout.width)) {
            this._dim.height = event.nativeEvent.layout.height;
            this._dim.width = event.nativeEvent.layout.width;
            if (this.props.onSizeChanged) {
                this.props.onSizeChanged(this._dim, this.props.index);
            }
            if (this.props.onLayout) {
                this.props.onLayout(this.props.index);
            }
        } else {
            if (this.props.removeNonDeterministicShifting) {
                if (this.props.onLayout) {
                    this.props.onLayout(this.props.index);
                }
                if (!this._isVisible) {
                    this._makeVisible();
                }
            }
        }
    }
}
