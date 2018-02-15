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
        const styleObj: CSSProperties = this.props.forceNonDeterministicRendering
            ? {
                WebkitTransform: this._getTransform(),
                left: 0,
                position: "absolute",
                flexDirection: "column",
                display: "flex",
                top: 0,
                transform: this._getTransform(),
            }
            : {
                WebkitTransform: this._getTransform(),
                height: this.props.height,
                left: 0,
                overflow: "hidden",
                position: "absolute",
                flexDirection: "column",
                display: "flex",
                top: 0,
                transform: this._getTransform(),
                width: this.props.width,
            };
        return (
            <div ref={this._setRef} style={styleObj}>
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
