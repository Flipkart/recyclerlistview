/// <reference types="react" />
import BaseViewRenderer, { ViewRendererProps } from "../../../core/viewrenderer/BaseViewRenderer";
/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
export default class ViewRenderer extends BaseViewRenderer<any> {
    private _dim;
    private _mainDiv;
    constructor(props: ViewRendererProps<any>);
    componentDidMount(): void;
    componentDidUpdate(): void;
    render(): JSX.Element;
    protected getRef(): object | null;
    private _setRef(div);
    private _getTransform();
    private _checkSizeChange();
}
