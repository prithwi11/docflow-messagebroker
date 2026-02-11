import mongoose, { Connection, Schema, Model } from "mongoose";
import dotenv from "dotenv"
dotenv.config()

export class TestDatabase {
    private connection: Connection | null = null;

    // Generates a standalone connection object
    async createStandaloneConnection_old(): Promise<Connection> {
        if (this.connection) {
            return this.connection
        }

        const uri = `${process.env.MONGODB_URI}${process.env.TEST_DB_NAME}`;
        console.log("uri", uri)
        try {
            // .createConnection() returns a Connection object, not the mongoose singleton
            this.connection = await mongoose.createConnection(uri).asPromise();
            console.log("Independent Connection Established to:", this.connection.host);
            return this.connection;
        } catch (error: any) {
            console.error("Connection error:", error.message);
            throw error;
        }
    }

    async createStandaloneConnection() {
        try {
            mongoose.connect(`${process.env.MONGODB_URI}${process.env.TEST_DB_NAME}`).then((res) => {
                
                mongoose.connection.useDb(process.env.TEST_DB_NAME || "");
                console.log("Connected to MongoDB Database", res.connection.host);
            }).catch((err: any) => console.log("Error from MongoDB", err));
            return mongoose;
        } catch (error: any) {
            console.log("Error connecting to MongoDB:", error.message)
        }
    }

    async closeConnection() {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }

    getConnection(): Connection {
        if(!this.connection) {
            throw new Error("Connection not established")
        }
        return this.connection
    }
}

export class MongoModel {
    public model: any;

    constructor(connection: Connection, name: string, schemaDefinition: object, schemaOptions: any = {}) {
        const schema = new Schema(schemaDefinition, schemaOptions);
        
        // Define the model specifically on this independent connection
        this.model = connection.model(name, schema);
    }

    async addNewRecord(dataobj: object): Promise<any> {
        return this.model.create(dataobj);
    }

    async addBulkRecord(dataobj: any[]): Promise<any> {
        return this.model.insertMany(dataobj);
    }

    async findByAny(dataobj: object, attributeObj: object = {}): Promise<any> {
        return this.model.findOne(dataobj, attributeObj).exec();
    }

    async findAllByAny(dataobj: object, attributes: object = {}): Promise<any> {
        return this.model.find(dataobj).select(attributes).exec();
    }

    async updateAnyRecord(filterObj: object, updateObj: object): Promise<any> {
        return this.model.updateMany(filterObj, updateObj).exec();
    }

    async deleteMany(filterObj: object): Promise<any> {
        return this.model.deleteMany(filterObj).exec();
    }

    async findOneAndUpdate(filterObj: object, updateObj: object, options: object = { new: true }): Promise<any> {
        return this.model.findOneAndUpdate(filterObj, updateObj, options).exec();
    }

    async countAllByFilter(filterObj: object): Promise<number> {
        return this.model.countDocuments(filterObj).exec();
    }
}