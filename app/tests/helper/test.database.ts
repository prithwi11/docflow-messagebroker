import mongoose, { Connection, Schema, Model } from "mongoose";

export class TestDatabase {
    // Generates a standalone connection object
    async createStandaloneConnection() {
        const uri = `${process.env.MONGODB_URI}${process.env.TEST_DB_NAME}`;
        try {
            // .createConnection() returns a Connection object, not the mongoose singleton
            const conn = await mongoose.createConnection(uri).asPromise();
            console.log("Independent Connection Established to:", conn.host);
            return conn;
        } catch (error: any) {
            console.error("Connection error:", error.message);
            throw error;
        }
    }
}

export class MongoModel {
    private connection: Connection;
    public model: any;

    constructor(connection: Connection, name: string, schemaDefinition: object, schemaOptions: any = {}) {
        this.connection = connection;
        const schema = new Schema(schemaDefinition, schemaOptions);
        
        // Define the model specifically on this independent connection
        this.model = this.connection.model(name, schema);
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

    // Helper to close this specific connection
    async close() {
        await this.connection.close();
    }
}