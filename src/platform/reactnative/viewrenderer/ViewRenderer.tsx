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
    } : requestDeferrer;

/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
export default class ViewRenderer extends BaseViewRenderer<any> {
    private _dim: Dimension = { width: 0, height: 0 };
    private _isFirstLayoutDone: boolean = false;
    private _container: View | null = null;
    private _opacity: number = 0;
    constructor(props: ViewRendererProps<any>) {
        super(props);
        this._onLayout = this._onLayout.bind(this);
        this._refGrabber = this._refGrabber.bind(this);
    }

    public shouldComponentUpdate(newProps: ViewRendererProps<any>): boolean {
        if (newProps.forceNonDeterministicRendering && this._opacity === 0 && this._isFirstLayoutDone) {
            this._setOpacity(1);
        }
        if (this.props.extendedState !== newProps.extendedState ||
            (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data)) ||
            this.props.layoutProvider !== newProps.layoutProvider) {
            return true;
        }
        if (!newProps.forceNonDeterministicRendering && (this.props.width !== newProps.width ||
            this.props.height !== newProps.height)) {
            return true;
        }
        //Only if not re-rendering
        if (this.props.x !== newProps.x || this.props.y !== newProps.y) {
            if (this._container) {
                this._container.setNativeProps({
                    left: newProps.x,
                    top: newProps.y,
                });
            }
        }
        return false;
    }
    public render(): JSX.Element {
        return this.props.forceNonDeterministicRendering ?
            <View ref={this._refGrabber} onLayout={this._onLayout}
                style={{
                    flexDirection: this.props.isHorizontal ? "column" : "row",
                    left: this.props.x,
                    opacity: this._opacity,
                    position: "absolute",
                    top: this.props.y,
                }}>
                {this.renderChild()}
            </View>
            :
            <View ref={this._refGrabber}
                style={{
                    height: this.props.height,
                    left: this.props.x,
                    position: "absolute",
                    top: this.props.y,
                    width: this.props.width,
                }}>
                {this.renderChild()}
            </View>;
    }

    private _setOpacity(opacityVal: number): void {
        this._opacity = opacityVal;
        customAnimFrame(() => {
            if (this._container) {
                this._container.setNativeProps({
                    opacity: opacityVal,
                });
            }
        });
    }

    private _refGrabber(ref: any): void {
        this._container = ref;
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
