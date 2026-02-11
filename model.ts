'use strict'
import Mongoose from "mongoose"
import { Connection } from "./config/connection";
import dotenv from "dotenv"
dotenv.config();
export class MongoModel {
    private connection: any
    private schema: {}
    public MongoModel: any;

    constructor(name: string, schema: {}, schemaOptions: any = {}) {
        let connection = new Connection();
        this.connection = connection.connect();
        this.schema = this.connection.Schema(schema, schemaOptions);
        this.connection.models = {};
        this.MongoModel = this.connection.model(name, this.schema);
    
    }

    addNewRecord(dataobj: object): Promise<object> {
        return this.MongoModel.create(dataobj);
    }

    addBulkRecord(dataobj: object): Promise<object> {
        return this.MongoModel.insertMany(dataobj);
    }

    findByAny(dataobj: object, attributeObj: object): Promise<object> {
        return this.MongoModel.findOne(dataobj, attributeObj);
    }

    findAllByAny(dataobj: object, attributes: object): Promise<object> {
        return this.MongoModel.find(dataobj).select(attributes).exec();
    }

    findSelectiveByAny(dataobj: { data: object, attributes: object, offset: number, limit: number, sort: object }): Promise<object> {
        return this.MongoModel.find(dataobj.data).select(dataobj.attributes).skip(dataobj.offset).limit(dataobj.limit).sort(dataobj.sort);
    }

    countSelectiveByAny(dataobj: { data: object, attributes: object, offset: number, limit: number, sort: object }): Promise<object> {
        return this.MongoModel.find(dataobj.data).select(dataobj.attributes).skip(dataobj.offset).limit(dataobj.limit).sort(dataobj.sort).countDocuments();
    }

    countAllByAny(dataobj: object): Promise<object> {
        return this.MongoModel.find(dataobj).countDocuments();
    }

    updateAnyRecord(filterObj: object, updateObj: object): Promise<object> {
        
        return this.MongoModel.updateMany(filterObj, updateObj);
    }

    deleteMany(fileterObj: object): Promise<object> {
        return this.MongoModel.deleteMany(fileterObj);
    }

    deleteOne(fileterObj: object): Promise<object> {
        return this.MongoModel.deleteOne(fileterObj);
    }

    countAllByFilter(fileterObj: object): Promise<object> {
        return this.MongoModel.countDocuments(fileterObj);
    }

    findOneAndUpdate(fileterObj: object, updateObj: object, options: object = {}): Promise<object> {
        return this.MongoModel.findOneAndUpdate(fileterObj, updateObj, options)
    }
}