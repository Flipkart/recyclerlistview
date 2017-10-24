import React from 'react';
import PropTypes from 'prop-types';

/***
 * View renderer is responsible for creating a container of size provided by LayoutProvider and render content inside it.
 * Also enforces a logic to prevent re renders. RecyclerListView keeps moving these ViewRendereres around using transforms to enable recycling.
 * View renderer will only update if its position, dimensions or given data changes. Make sure to have a relevant shouldComponentUpdate as well.
 * This is second of the two things recycler works on. Implemented both for web and react native.
 */
class ViewRenderer extends React.Component {
  constructor(args) {
    super(args);
    this._dim = {};
    this._isFirstLayoutDone = false;
  }

  componentDidMount() {
    this._checkSizeChange();
  }

  componentDidUpdate() {
    this._checkSizeChange();
  }

  shouldComponentUpdate(newProps) {
    return (
      this.props.x !== newProps.x ||
      this.props.y !== newProps.y ||
      this.props.width !== newProps.width ||
      this.props.height !== newProps.height ||
      (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data))
    );
  }

  _getTransform() {
    return 'translate(' + this.props.x + 'px,' + this.props.y + 'px) ' + (this.props.inverted ? this.props.isHorizontal ? "scaleX(-1)" : "scaleY(-1)" : "");
  }

  _checkSizeChange() {
    if (this.props.forceNonDeterministicRendering && this.props.onSizeChanged) {
      let mainDiv = this.refs.mainDiv;
      if (mainDiv) {
        this._dim.width = mainDiv.clientWidth;
        this._dim.height = mainDiv.clientHeight;
        if (this.props.width !== this._dim.width || this.props.height !== this._dim.height) {
          this.props.onSizeChanged(this._dim, this.props.index);
        } else if (!this._isFirstLayoutDone) {
          this._isFirstLayoutDone = true;
          this.forceUpdate();
        }
      }
    }
    this._isFirstLayoutDone = true;
  }

  render() {
    let styleObj = this.props.forceNonDeterministicRendering
      ? {
          position: 'absolute',
          left: 0,
          top: 0,
          opacity: this._isFirstLayoutDone ? 1 : 0,
          transform: this._getTransform(),
          WebkitTransform: this._getTransform()
        }
      : {
          position: 'absolute',
          overflow: 'hidden',
          left: 0,
          top: 0,
          width: this.props.width,
          height: this.props.height,
          transform: this._getTransform(),
          WebkitTransform: this._getTransform()
        };
    return (
      <div ref="mainDiv" style={styleObj}>
          {this.props.childRenderer(this.props.layoutType, this.props.data, this.props.index)}
      </div>
    );
  }
}

export default ViewRenderer;
//#if [DEV]
ViewRenderer.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  childRenderer: PropTypes.func.isRequired,
  layoutType: PropTypes.any,
  dataHasChanged: PropTypes.func,
  onSizeChanged: PropTypes.func,
  data: PropTypes.any,
  index: PropTypes.number,
  forceNonDeterministicRendering: PropTypes.bool,
  isHorizontal: PropTypes.bool
};
//#endif
