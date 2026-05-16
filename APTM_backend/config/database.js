//this script was created by jack {Mthandeni Mnyandu} copyrigh 2024, all rights reserved. this script is used to connect to the database using mongoose. it uses the MONGO_URI environment variable to connect to the database. if the connection is successful, it will log the host of the database. if there is an error, it will log the error message and exit the process with a status code of 1.
import mongoose from "mongoose";

export const connectDB = async()=>{
  try{
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

  }catch(error){
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};