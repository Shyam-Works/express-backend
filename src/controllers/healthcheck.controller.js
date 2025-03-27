import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    try {
        // Create a new ApiResponse object
        const response = new ApiResponse(200, { status: 'OK' }, 'Service is healthy');
        
        // Send the response back with a valid status code (200)
        return res.status(response.statusCode).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json(new ApiResponse(500, null, 'Internal Server Error'));
    }
})

export {
    healthcheck
    }
    