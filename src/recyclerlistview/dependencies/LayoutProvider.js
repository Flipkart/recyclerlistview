/**
 * Created by talha.naqvi on 05/04/17.
 * You can create a new instance or inherit and override default methods
 * You may need access to data provider here, it might make sense to pass a function which lets you fetch the latest data provider
 * Why only indexes? The answer is to allow data virtualization in the future. Since layouts are accessed much before the actual render assuming having all
 * data upfront will only limit possibilites in the future.
 */
class LayoutProvider {
    constructor(getLayoutTypeForIndex, setLayoutForType) {
        this._getLayoutTypeForIndex = getLayoutTypeForIndex;
        this._setLayoutForType = setLayoutForType;
    }

    //Provide a type for index, something which identifies the template of view about to load
    getLayoutTypeForIndex(index) {
        return this._getLayoutTypeForIndex(index);
    }

    //Given a type and dimension set the dimension values on given dimension object
    setLayoutForType(type, dimension) {
        return this._setLayoutForType(type, dimension);
    }
}
export default LayoutProvider;
