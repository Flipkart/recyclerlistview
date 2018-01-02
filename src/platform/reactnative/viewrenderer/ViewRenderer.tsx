import * as React from "react";
import { LayoutChangeEvent, View, Animated, Platform } from "react-native";
import { Dimension } from "../../../core/dependencies/LayoutProvider";
import BaseViewRenderer, { ViewRendererProps } from "../../../core/viewrenderer/BaseViewRenderer";

const requestDeferrer = requestAnimationFrame ? requestAnimationFrame : (func: () => void) => { setTimeout(func, 20); };
const customAnimFrame = Platform.OS === "web" ?
    (func: () => void) => {
        requestDeferrer(() => {
            requestDeferrer(() => {
                requestDeferrer(func);
            });
        });
    }
    :
    (func: () => void) => {
        func();
    };

/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
export default class ViewRenderer extends BaseViewRenderer<any> {
    private _dim: Dimension = { width: 0, height: 0 };
    private _isFirstLayoutDone: boolean = false;
    private _isUnmounted: boolean = false;
    private _animated = {
        opacity: new Animated.Value(0),
        opacityTracker: 0,
        x: new Animated.Value(0),
        y: new Animated.Value(0),
    };
    constructor(props: ViewRendererProps<any>) {
        super(props);
        this._onLayout = this._onLayout.bind(this);
    }

    public shouldComponentUpdate(newProps: ViewRendererProps<any>): boolean {
        if (this.props.x !== newProps.x || this.props.y !== newProps.y) {
            this._animated.x.setValue(newProps.x);
            this._animated.y.setValue(newProps.y);
        }
        if (newProps.forceNonDeterministicRendering && this._animated.opacityTracker === 0 && this._isFirstLayoutDone) {
            customAnimFrame(() => {
                this._setOpacity(1);
            });
        }
        if (this.props.extendedState !== newProps.extendedState || (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data))) {
            return true;
        }
        if (!newProps.forceNonDeterministicRendering && (this.props.width !== newProps.width ||
            this.props.height !== newProps.height)) {
            return true;
        }
        return false;
    }
    public componentWillMount(): void {
        this._animated.x.setValue(this.props.x);
        this._animated.y.setValue(this.props.y);
    }
    public componentWillUnmount(): void {
        this._isUnmounted = true;
    }
    public render(): JSX.Element {
        if (this.props.forceNonDeterministicRendering) {
            return (
                <Animated.View onLayout={this._onLayout}
                    style={{
                        flexDirection: this.props.isHorizontal ? "column" : "row",
                        left: this._animated.x,
                        opacity: this._animated.opacity,
                        position: "absolute",
                        top: this._animated.y,
                    }}>
                    {this.renderChild()}
                </Animated.View>
            );
        } else {
            return (
                <Animated.View
                    style={{
                        height: this.props.height,
                        left: 0,
                        position: "absolute",
                        top: 0,
                        transform: [{ translateX: this._animated.x }, { translateY: this._animated.y }],
                        width: this.props.width,
                    }}>
                    {this.renderChild()}
                </Animated.View>
            );
        }
    }

    private _setOpacity(opacity: number): void {
        if (!this._isUnmounted) {
            this._animated.opacity.setValue(opacity);
            this._animated.opacityTracker = opacity;
        }
    }

    private _onLayout(event: LayoutChangeEvent): void {
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
        } else if (!this._isFirstLayoutDone) {
            this._isFirstLayoutDone = true;
            this._setOpacity(1);
        }
        this._isFirstLayoutDone = true;
    }
}
