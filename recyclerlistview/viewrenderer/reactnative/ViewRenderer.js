import React from "react";
import {View} from "react-native";
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
                {this.props.childRenderer(this.props.layoutType, this.props.data)}
            </View>
        );
    }
}
export default ViewRenderer;
//#if [DEV]
ViewRenderer.propTypes = {
    x: React.PropTypes.number.isRequired,
    y: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    width: React.PropTypes.number.isRequired,
    childRenderer: React.PropTypes.func.isRequired,
    layoutType: React.PropTypes.any,
    dataHasChanged: React.PropTypes.func,
    data: React.PropTypes.any
};
//#endif