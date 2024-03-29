import { Collection, Db, FindOneAndUpdateOptions, MongoClient, ObjectId } from 'mongodb';
import pick from 'lodash/pick';
import omit from 'lodash/omit';
import { DBConfig, ServerDB, FormScope } from '@formio/appserver-types';
const debug = require('debug')('formio:db');
const error = require('debug')('formio:error');
export class Database implements ServerDB {
    db: Db | null;
    currentCollectionName: string;
    currentCollection: Collection<Document> | null;
    defaultCollection: Collection<Document> | null;
    prefix: string = '';
    constructor(public config: DBConfig) {
        this.db = null;
        this.currentCollectionName = 'submissions';
        this.currentCollection = null;
        this.defaultCollection = null;
    }

    ObjectId(id: any) {
        if (id?.hasOwnProperty('$in')) {
            return {$in: id['$in'].map((_id: any) => this.ObjectId(_id))};
        }
        try {
            return id ? (new ObjectId(id)) : null;
        }
        catch (e) {
            return id;
        }
    }

    collectionName(name: string) {
        return `${this.prefix}${name}`;
    }

    /**
     * Connect to the database.
     * @param {*} scope 
     * @returns 
     */
    async connect(prefix = '') {
        this.prefix = prefix ? `${prefix}.` : '';
        try {
            debug('db.connect()');
            let config = {};
            if (this.config.config) {
                config = (typeof this.config.config === 'string') ? JSON.parse(this.config.config) : this.config.config;
            }
            const client = new MongoClient(this.config.url, config);
            await client.connect();
            this.db = await client.db();
            if (this.config.dropOnConnect) {
                await this.db.dropDatabase();
            }
            this.addIndex(this.db.collection(this.collectionName('project')), 'name');
            this.defaultCollection = this.db.collection(this.collectionName('submissions'));
            await this.setupIndexes(this.defaultCollection);
            debug('Connected to database');
        }
        catch (err: any) {
            error(err.message);
            process.exit();
        }
    }

    // Generic save record method.
    async save(collectionName: string, item: any) {
        if (!this.db) {
            return null;
        }
        const collection = this.db.collection(`${this.prefix}${collectionName}`);
        let result;
        try {
            debug('db.save()', collectionName);
            result = await collection.findOneAndUpdate(
                {_id: this.ObjectId(item._id)},
                {$set: omit(item, '_id')},
                ({upsert: true, returnOriginal: false} as FindOneAndUpdateOptions)
            );
        }
        catch (err: any) {
            error(err.message);
        }
        return result ? result.value : null;
    }

    // Generic load record method.
    async load(collectionName: string) {
        if (!this.db) {
            return null;
        }
        debug('db.load()', collectionName);
        const collection = this.db.collection(this.collectionName(collectionName));
        let item;
        try {
            item = await collection.findOne({});
        }
        catch (err: any) {
            error(err.message);
        } 
        return item;
    }

    // Generic delete record method.
    async remove(collectionName: string) {
        if (!this.db) {
            return null;
        }
        debug('db.remove()', collectionName);
        const collection = this.db.collection(this.collectionName(collectionName));
        let result;
        try {
            result = await collection.deleteOne({});
        }
        catch (err: any) {
            error(err.message);
        }
        return result ? result.deletedCount : null;
    }

    /**
     * Ensures the form collection is created an returns it.
     * @param scope 
     * @returns 
     */
    async formCollection(scope: FormScope): Promise<Collection<Document> | null> {
        if (
            this.db && scope && scope.form && scope.form.settings && scope.form.settings.collection
        ) {
            if (this.currentCollection && this.currentCollectionName === scope.form.settings.collection) {
                return this.currentCollection;
            }
            let collection: Collection<Document> | null = null;
            try {
                debug('db.createCollection()', scope.form.settings.collection);
                await this.db.createCollection(this.collectionName(scope.form.settings.collection));
                collection = this.db.collection(this.collectionName(scope.form.settings.collection));
                this.setupIndexes(collection, scope)
            }
            catch (err: any) {
                error(err.message);
            }
            this.currentCollection = collection || this.db.collection(this.collectionName(scope.form.settings.collection));
            this.currentCollectionName = scope.form.settings.collection;
            return this.currentCollection;
        }
        return this.defaultCollection;
    }

    /**
     * Setup indexes.
     */
    async setupIndexes(collection: Collection<Document> | null, scope?: FormScope) {
        if (!collection) {
            return;
        }
        this.addIndex(collection, 'project');
        this.addIndex(collection, 'form');
        this.addIndex(collection, 'deleted');
        this.addIndex(collection, 'modified');

        // If TTL index is needed add that here.
        if (this.config.ttl) {
            try {
                collection.createIndex({
                    created: 1
                }, {
                    background: true,
                    expireAfterSeconds: this.config.ttl
                });
            }
            catch (err: any) {
                error('Cannot add TTL index', err.message);
            }
        }
        else {
            this.addIndex(collection, 'created');
        }

        if (scope && scope.form && scope.form.components) {
            scope.utils.eachComponent(scope.form.components, (component: any, components: any[], path: string) => {
                if (component.dbIndex) {
                    this.addIndex(collection, `data.${path}`);
                }
            });
        }
    }

    /**
     * Add a field index
     */
    async addIndex(collection: Collection<Document>, path: string) {
        const index: any = {};
        index[path] = 1;
        try {
            debug('db.addIndex()', path);
            collection.createIndex(index, {background: true});
        }
        catch (err: any) {
            error(`Cannot add index ${path}`, err.message);
        }
    }

    /**
     * Adds new indexes to the forms submission collection.
     * @param scope 
     * @param indexes 
     * @returns 
     */
    async addIndexes(scope: FormScope, indexes: string[]) {
        const collection: Collection<Document> | null = await this.formCollection(scope);
        if (!collection) {
            return;
        }
        for (const path of indexes) {
            await this.addIndex(collection, `data.${path}`);
        }
    }

    /**
     * Remove a field index.
     */
    async removeIndex(collection: Collection<Document>, path: string) {
        const index: any = {};
        index[path] = 1;
        try {
            debug('db.removeIndex()', path);
            collection.dropIndex(index);
        }
        catch (err: any) {
            error(`Cannot remove index ${path}`, err.message);
        }
    }

    /**
     * Removes indexes to the forms submission collection.
     * @param scope 
     * @param indexes 
     * @returns 
     */
    async removeIndexes(scope: FormScope, indexes: string[]) {
        const collection: Collection<Document> | null = await this.formCollection(scope);
        if (!collection) {
            return;
        }
        for (const path of indexes) {
            await this.removeIndex(collection, `data.${path}`);
        }
    }

    /**
     * Fetch a list of submissions from a table/collection.
     * @param {*} table 
     * @param {*} query 
     */
    async index(scope: FormScope, query: any = {}) {
        let items, skip, limit, count;
        try {
            limit = query.limit || 10;
            skip = query.skip || 0;
            const sort = query.sort || {created: -1};
            let project: any = {};
            if (query.select) {
                const fields = query.select.split(',');
                fields.forEach((field: string) => {
                    project[field] = true;
                });
            }
            delete query.limit;
            delete query.skip;
            delete query.sort;
            delete query.select;
            debug('db.index()', query);
            items = await this.find(scope, query, limit, skip, sort, project);
            count = await this.count(scope, query);
        }
        catch (err: any) {
            error(err.message);
        }
        return {items, limit, skip, count};
    }

    /**
     * Perform a count of the amount of documents within a collection.
     * @param scope
     * @param query
     * @returns 
     */
    async count(scope: FormScope, query: any = {}) {
        let count = 0;
        try {
            debug('db.count()', query);
            const collection: Collection<Document> | null = await this.formCollection(scope);
            if (!collection) {
                return 0;
            }
            count = await collection.countDocuments(this.query(scope, query));
        }
        catch (err: any) {
            error(err.message);
        }
        return count;
    }

    /**
     * Create a new record.
     */
    async create(scope: FormScope, record: any, allowFields: string[] = []) {
        record.deleted = null;
        record.created = new Date();
        record.modified = new Date();
        if (scope.form && scope.form._id) {
            record.form = this.ObjectId(scope.form._id);
        }
        if (scope.project && scope.project._id) {
            record.project = this.ObjectId(scope.project._id);
        }
        if (record.owner) {
            record.owner = this.ObjectId(record.owner);
        }
        const collection: any = await this.formCollection(scope);
        try {
            debug('db.create()', record);
            const result: any = await collection.insertOne(pick(record, [
                'data', 
                'metadata', 
                'modified',
                'created',
                'deleted',
                'form',
                'project',
                'owner',
                'access'
            ].concat(allowFields)));
            if (!result.insertedId) {
                return null;
            }
            return await this.read(scope, result.insertedId);
        }
        catch (err: any) {
            error(err.message);
        }
    }

    /**
     * Return a query for a single mongo record.
     * @param {*} form 
     * @param {*} id 
     * @returns 
     */
    query(scope: FormScope, query: any = {}, subQuery = false) {
        if (query._id) {
            query._id = this.ObjectId(query._id);
        }
        if (query.owner) {
            query.owner = this.ObjectId(query.owner);
        }
        if (query.form) {
            query.form = this.ObjectId(query.form);
        }
        else if (!subQuery && scope.form && scope.form._id) {
            query.form = this.ObjectId(scope.form._id);
        }
        if (!subQuery && scope.project && scope.project._id) {
            query.project = this.ObjectId(scope.project._id);
        }
        if (!subQuery) {
            query.deleted = {$eq: null};
        }

        // Handle nested queries.
        ['$or', '$and'].forEach((key) => {
            if (query[key]) {
                query[key].forEach((subQuery: any) => this.query(scope, subQuery, true));
            }
        });
        return query;
    }

    /**
     * Find many records that match a query.
     */
    async find(
        scope: FormScope,
        query: any = {},
        limit: number = 10,
        skip: number = 0,
        sort: any = {created: -1},
        select: any = {}
    ) {
        try {
            debug('db.find()', query);
            const collection: Collection<Document> | null = await this.formCollection(scope);
            if (!collection) {
                return [];
            }
            return await collection.find(this.query(scope, query)).limit(limit).skip(skip).sort(sort).project(select).toArray();
        }
        catch (err: any) {
            error(err.message);
        }
        return [];
    }

    /**
     * Find a record for a provided query.
     */
    async findOne(scope: FormScope, query: any = {}) {
        try {
            debug('db.findOne()', query);
            const collection: Collection<Document> | null = await this.formCollection(scope);
            if (!collection) {
                return null;
            }
            return await collection.findOne(this.query(scope, query));
        }
        catch (err: any) {
            error(err.message);
        }
        return null;
    }

    /**
     * Read a single submission from a form
     * 
     * @param {*} table 
     * @param {*} query 
     */
    async read(scope: FormScope, id: string) {
        try {
            debug('db.read()', id);
            const collection: Collection<Document> | null = await this.formCollection(scope);
            if (!collection) {
                return null;
            }
            return await collection.findOne(this.query(scope, {_id: this.ObjectId(id)}));
        }
        catch (err: any) {
            error(err.message);
        }
        return null;
    }

    /**
     * Update a single submission of a form.
     * 
     * @param {*} table 
     * @param {*} query 
     */
    async update(scope: FormScope, id: string, update: any, allowFields: string[] = []) {
        if (!id || !update) {
            return null;
        }
        update.modified = new Date();
        try {
            debug('db.update()', id, update);
            const collection: Collection<Document> | null = await this.formCollection(scope);
            if (!collection) {
                return null;
            }
            const result = await collection.updateOne(this.query(scope, {_id: this.ObjectId(id)}), { 
                $set: pick(update, ['data', 'metadata', 'modified'].concat(allowFields)) 
            });
            if (result.modifiedCount === 0) {
                return null;
            }
            return await this.read(scope, id);
        }
        catch (err: any) {
            error(err.message);
        }
        return null;
    }

    /**
     * Delete a record from the database.
     */
    async delete(scope: FormScope, id: string) {
        if (!id) {
            return false;
        }
        try {
            debug('db.delete()', id);
            const collection: Collection<Document> | null = await this.formCollection(scope);
            if (!collection) {
                return false;
            }
            const result = await collection.updateOne(this.query(scope, {_id: this.ObjectId(id)}), { $set: {deleted: Date.now()} });
            return result.modifiedCount > 0;
        }
        catch (err: any) {
            error(err.message);
        }
        return false;
    }
}
