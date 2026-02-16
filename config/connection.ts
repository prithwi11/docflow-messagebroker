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
            mongoose.connect(`${this._config.mongoUri}${db}`).then((res) => {
                
                mongoose.connection.useDb(this._config.dbName || "");
                console.log("Connected to MongoDB Database", res.connection.host);
            }).catch((err: any) => console.log("Error from MongoDB", err));
            return mongoose;
        } catch (error: any) {
            console.log("Error connecting to MongoDB:", error.message)
        }
    }
}