import mongoose from "mongoose";

export class Connection {
    connect() {
        try {
            mongoose.connect(`${process.env.MONGODB_URI}${process.env.DB_NAME}`).then((res) => {
                
                mongoose.connection.useDb(process.env.DB_NAME || "");
                console.log("Connected to MongoDB Database", res.connection.host);
            }).catch((err: any) => console.log("Error from MongoDB", err));
            return mongoose;
        } catch (error: any) {
            console.log("Error connecting to MongoDB:", error.message)
        }
    }
}