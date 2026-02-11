import mongoose from "mongoose";
import dotenv from "dotenv"
import { AppConfig, configs } from "./app.config";
dotenv.config()
export class Connection {
    private _config: AppConfig;
    constructor(appConfig: AppConfig = configs) {
        this._config = appConfig;
    }
    connect() {
        try {
            const db = this._config.dbName;
            mongoose.connect(`${process.env.MONGODB_URI}${db}`).then((res) => {
                
                mongoose.connection.useDb(process.env.db || "");
                console.log("Connected to MongoDB Database", res.connection.host);
            }).catch((err: any) => console.log("Error from MongoDB", err));
            return mongoose;
        } catch (error: any) {
            console.log("Error connecting to MongoDB:", error.message)
        }
    }
}