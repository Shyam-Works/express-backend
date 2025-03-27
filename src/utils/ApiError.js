class ApiError extends Error{ // extend Error methods which is inbuilt of node
    constructor(
        statusCode, // The HTTP status code representing the error (e.g., 404 for "Not Found").
        message= "Something went wrong",
        errors=[], // An array of error details default empty array
        stack="" // stack trace string to help with debugging
    ){
        super(message) // Calls the constructor of the Error class with the message argument.
        this.statusCode = statusCode // overwrite status code 
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}