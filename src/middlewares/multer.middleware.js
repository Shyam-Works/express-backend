import multer from "multer";
import streamifier from "streamifier";

// Use memoryStorage to store the file in memory instead of local disk
const storage = multer.memoryStorage(); 

export const upload = multer({ storage });



// import multer from "multer";
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "./public/temp") // put file here locally
//     },
//     filename: function (req, file, cb) {
      
//         // save file name by original name. it is little risky if 2 people with same name upload file on same time but since file will be store 
//       cb(null, file.originalname)
//     }
    
// })
// console.log("in multer file")
// export  const upload = multer({ 
//     storage,
// })