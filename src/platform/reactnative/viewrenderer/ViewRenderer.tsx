import * as React from "react";
import { LayoutChangeEvent, View, ViewProperties } from "react-native";
import { Dimension } from "../../../core/dependencies/LayoutProvider";
import { LayoutManager } from "../../../core/layoutmanager/LayoutManager";
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
    private _layoutManagerRef?: LayoutManager;
    public renderCompat(): JSX.Element {
        const props = this.props.forceNonDeterministicRendering
          ? {
              ref: this._setRef,
              onLayout: this._onLayout,
              style: {
                flexDirection: this.props.isHorizontal ? "column" : "row",
                left: this.props.x,
                position: "absolute",
                top: this.props.y,
                ...this.props.styleOverrides,
                ...this.animatorStyleOverrides,
              },
            }
          : {
              ref: this._setRef,
              style: {
                left: this.props.x,
                position: "absolute",
                top: this.props.y,
                height: this.props.height,
                width: this.props.width,
                ...this.props.styleOverrides,
                ...this.animatorStyleOverrides,
              },
            };
        return this._renderItemContainer(props, this.props, this.renderChild()) as JSX.Element;
    }

    public componentDidUpdate(): void {
        super.componentDidUpdate();
        if (this.props.layoutProvider && this._layoutManagerRef) {
            if (this.props.layoutProvider.getLayoutManager() !== this._layoutManagerRef) {
                this._layoutManagerRef = this.props.layoutProvider.getLayoutManager();
                this._scheduleForceSizeUpdateTimer();
            }
        }
    }

    public componentDidMount(): void {
        super.componentDidMount();
        if (this.props.layoutProvider) {
            this._layoutManagerRef = this.props.layoutProvider.getLayoutManager();
        }
    }

    protected getRef(): object | null {
        return this._viewRef;
    }

    private _renderItemContainer(props: object, parentProps: ViewRendererProps<any>, children: React.ReactNode): React.ReactNode {
        return (this.props.renderItemContainer && this.props.renderItemContainer(props, parentProps, children)) || (<View {...props}>{children}</View>);
    }

    private _setRef = (view: React.Component<ViewProperties, React.ComponentState> | null): void => {
        this._viewRef = view;
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

    private _scheduleForceSizeUpdateTimer = () => {
        // forceSizeUpdate calls onSizeChanged which can only be called when non-deterministic rendering is used.
        if (!this.props.forceNonDeterministicRendering) {
            return;
        }
        const oldDim = {...this._dim};
        setTimeout(() => {
            this._forceSizeUpdate(oldDim);
        }, 32);
    }

    private _forceSizeUpdate = (dim: Dimension): void => {
        if (dim.width === this._dim.width && dim.height === this._dim.height) {
            if (this.isRendererMounted && this.props.onSizeChanged) {
                this.props.onSizeChanged(this._dim, this.props.index);
            }
        }
    }
}
