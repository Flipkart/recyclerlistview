export default class CustomError extends Error{
    constructor(exception, id){
        super(exception.message, id);
        this.name = exception.type;
    }
}