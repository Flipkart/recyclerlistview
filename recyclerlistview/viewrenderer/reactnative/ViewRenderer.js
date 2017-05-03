import React from "react";
import {View} from "react-native";
import PropTypes from 'prop-types';

class ViewRenderer extends React.Component {
    shouldComponentUpdate(newProps) {
        return (this.props.x !== newProps.x ||
        this.props.y !== newProps.y ||
        this.props.width !== newProps.width ||
        this.props.height !== newProps.height ||
        (this.props.dataHasChanged && this.props.dataHasChanged(this.props.data, newProps.data)));
    }

    render() {
        return (
            <View style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: this.props.width,
                height: this.props.height,
                transform: [{translateX: this.props.x}, {translateY: this.props.y}]
            }}>
                {this.props.childRenderer(this.props.layoutType, this.props.data, this.props.index)}
            </View>
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
    data: PropTypes.any,
    index: PropTypes.number
};
//#endif