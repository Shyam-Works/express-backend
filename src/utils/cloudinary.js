import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "auto", public_id: fileName },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    reject(error);
                }
                resolve(result);
            }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

export { uploadOnCloudinary };


// // this file has function to upload file into cloud and config


// import {v2 as cloudinary} from "cloudinary";
// import fs from "fs" // file system default library.
// import dotenv from 'dotenv';

// dotenv.config();

// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
// });


// // here we will use this function with some variable value of image or video and upload them all into cloud from our local server.
// const uploadOnCloudinary = async(localFilePath) =>{
//     try {
//         if (!localFilePath) {
//             return null;
//         }
        
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         });
        
        
//         if (response?.url) {
            
//             fs.unlinkSync(localFilePath); 
//             return response;
//         } else {
            
//             fs.unlinkSync(localFilePath); 
//             return null;
//         }
//     } catch (error) {
        
//         fs.unlinkSync(localFilePath); 
//         return null;
// }
// }

// export {uploadOnCloudinary};