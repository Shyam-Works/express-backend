// if error will occur asyncHandler will pass to the next middleware to avoid server crash
const asyncHandler = (requestHandler)=>{
    return (req,res,next) =>{
        Promise.resolve(requestHandler(req,res,next)).
        catch((err)=> next(err))
    }
}
export {asyncHandler}

