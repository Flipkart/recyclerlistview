import * as React from "react";
import { CSSProperties } from "react";
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
    private _mainDiv: HTMLDivElement | null = null;

    constructor(props: ViewRendererProps<any>) {
        super(props);
        this._setRef = this._setRef.bind(this);
    }

    public componentDidMount(): void {
        if (super.componentDidMount) {
            super.componentDidMount();
        }
        this._checkSizeChange();
    }

    public componentDidUpdate(): void {
        this._checkSizeChange();
    }

    public render(): JSX.Element {
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
            <div ref={this._setRef} style={style}>
                {this.renderChild()}
            </div>
        );
    }

    protected getRef(): object | null {
        return this._mainDiv;
    }
    private _setRef(div: HTMLDivElement | null): void {
        this._mainDiv = div;
    }
    private _getTransform(): string {
        return "translate(" + this.props.x + "px," + this.props.y + "px)";
    }

    private _checkSizeChange(): void {
        if (this.props.forceNonDeterministicRendering && this.props.onSizeChanged) {
            const mainDiv = this._mainDiv;
            if (mainDiv) {
                this._dim.width = mainDiv.clientWidth;
                this._dim.height = mainDiv.clientHeight;
                if (this.props.width !== this._dim.width || this.props.height !== this._dim.height) {
                    this.props.onSizeChanged(this._dim, this.props.index);
                }
            }
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
        flexDirection: "column",
        margin: 0,
        padding: 0,
        position: "absolute",
        minHeight: 0,
        minWidth: 0,
        left: 0,
        top: 0,
    },
};
