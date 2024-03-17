"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
const mongodb_1 = require("mongodb");
const lodash_1 = require("lodash");
const core_1 = require("@formio/core");
const debug = require('debug')('formio:db');
const error = require('debug')('formio:error');
class Database {
    constructor(config) {
        this.config = config;
        this.prefix = '';
        this.db = null;
        this.currentCollectionName = 'submissions';
        this.currentCollection = null;
        this.defaultCollection = null;
    }
    ObjectId(id) {
        if (id === null || id === void 0 ? void 0 : id.hasOwnProperty('$in')) {
            return { $in: id['$in'].map((_id) => this.ObjectId(_id)) };
        }
        try {
            return id ? (new mongodb_1.ObjectId(id)) : null;
        }
        catch (e) {
            return id;
        }
    }
    collectionName(name) {
        return `${this.prefix}${name}`;
    }
    /**
     * Connect to the database.
     * @param {*} scope
     * @returns
     */
    connect() {
        return __awaiter(this, arguments, void 0, function* (prefix = '') {
            this.prefix = prefix ? `${prefix}.` : '';
            try {
                debug('db.connect()');
                let config = {};
                if (this.config.config) {
                    config = (typeof this.config.config === 'string') ? JSON.parse(this.config.config) : this.config.config;
                }
                const client = new mongodb_1.MongoClient(this.config.url, config);
                yield client.connect();
                this.db = yield client.db();
                if (this.config.dropOnConnect) {
                    yield this.db.dropDatabase();
                }
                this.addIndex(this.collection('project'), 'name');
                this.defaultCollection = this.collection('submissions');
                yield this.setupIndexes(this.defaultCollection);
                debug('Connected to database');
            }
            catch (err) {
                error(err.message);
                process.exit();
            }
        });
    }
    collection(name) {
        return this.db ? this.db.collection(this.collectionName(name)) : null;
    }
    // Generic save record method.
    save(collectionName, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                return null;
            }
            const collection = this.collection(collectionName);
            if (!collection) {
                return null;
            }
            let result;
            try {
                debug('db.save()', collectionName);
                if (item._id) {
                    yield collection.updateOne({ _id: this.ObjectId(item._id) }, { $set: (0, lodash_1.omit)(item, '_id') });
                    return yield collection.findOne({ _id: this.ObjectId(item._id) });
                }
                else {
                    result = yield collection.insertOne(item);
                    return yield collection.findOne({ _id: this.ObjectId(result.insertedId) });
                }
            }
            catch (err) {
                error(err.message);
            }
            return null;
        });
    }
    saveOne(collectionName, item) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                return null;
            }
            const collection = this.collection(collectionName);
            if (!collection) {
                return null;
            }
            if (!item._id) {
                // Try to load an existing record if one exists.
                let existing = yield this.load(collectionName);
                if (existing && !existing._id) {
                    existing._id = new mongodb_1.ObjectId();
                    const result = yield collection.insertOne(existing);
                    existing = yield collection.findOne({ _id: this.ObjectId(result.insertedId) });
                }
                item._id = existing === null || existing === void 0 ? void 0 : existing._id;
            }
            return yield this.save(collectionName, item);
        });
    }
    // Generic load record method.
    load(collectionName_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, query = {}) {
            if (!this.db) {
                return null;
            }
            debug('db.load()', collectionName);
            const collection = this.collection(collectionName);
            if (!collection) {
                return null;
            }
            let item;
            try {
                item = yield collection.findOne(query);
            }
            catch (err) {
                error(err.message);
            }
            return item;
        });
    }
    // Generic delete record method.
    remove(collectionName_1) {
        return __awaiter(this, arguments, void 0, function* (collectionName, query = {}) {
            if (!this.db) {
                return null;
            }
            debug('db.remove()', collectionName);
            const collection = this.collection(collectionName);
            if (!collection) {
                return null;
            }
            let result;
            try {
                result = yield collection.deleteOne(query);
            }
            catch (err) {
                error(err.message);
            }
            return result ? result.deletedCount : null;
        });
    }
    /**
     * Ensures the form collection is created an returns it.
     * @param scope
     * @returns
     */
    formCollection(scope) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db && scope && scope.form && scope.form.settings && scope.form.settings.collection) {
                if (this.currentCollection && this.currentCollectionName === scope.form.settings.collection) {
                    return this.currentCollection;
                }
                let collection = null;
                try {
                    debug('db.createCollection()', scope.form.settings.collection);
                    yield this.db.createCollection(this.collectionName(scope.form.settings.collection));
                    collection = this.collection(scope.form.settings.collection);
                    this.setupIndexes(collection, scope);
                }
                catch (err) {
                    error(err.message);
                }
                this.currentCollection = collection || this.collection(scope.form.settings.collection);
                this.currentCollectionName = scope.form.settings.collection;
                return this.currentCollection;
            }
            return this.defaultCollection;
        });
    }
    /**
     * Setup indexes.
     */
    setupIndexes(collection, scope) {
        return __awaiter(this, void 0, void 0, function* () {
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
                catch (err) {
                    error('Cannot add TTL index', err.message);
                }
            }
            else {
                this.addIndex(collection, 'created');
            }
            if (scope && scope.form && scope.form.components) {
                scope.utils.eachComponent(scope.form.components, (component, path) => {
                    if (component.dbIndex) {
                        this.addIndex(collection, `data.${path}`);
                    }
                });
            }
        });
    }
    /**
     * Add a field index
     */
    addIndex(collection, path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!collection) {
                return;
            }
            const index = {};
            index[path] = 1;
            try {
                debug('db.addIndex()', path);
                collection.createIndex(index, { background: true });
            }
            catch (err) {
                error(`Cannot add index ${path}`, err.message);
            }
        });
    }
    /**
     * Adds new indexes to the forms submission collection.
     * @param scope
     * @param indexes
     * @returns
     */
    addIndexes(scope, indexes) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.formCollection(scope);
            if (!collection) {
                return;
            }
            for (const path of indexes) {
                yield this.addIndex(collection, `data.${path}`);
            }
        });
    }
    /**
     * Remove a field index.
     */
    removeIndex(collection, path) {
        return __awaiter(this, void 0, void 0, function* () {
            const index = {};
            index[path] = 1;
            try {
                debug('db.removeIndex()', path);
                yield collection.dropIndex(index);
            }
            catch (err) {
                error(`Cannot remove index ${path}`, err.message);
            }
        });
    }
    /**
     * Removes indexes to the forms submission collection.
     * @param scope
     * @param indexes
     * @returns
     */
    removeIndexes(scope, indexes) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = yield this.formCollection(scope);
            if (!collection) {
                return;
            }
            for (const path of indexes) {
                yield this.removeIndex(collection, `data.${path}`);
            }
        });
    }
    /**
     * Fetch a list of submissions from a table/collection.
     * @param {*} table
     * @param {*} query
     */
    index(scope_1) {
        return __awaiter(this, arguments, void 0, function* (scope, query = {}) {
            let items, skip, limit, count;
            try {
                limit = query.limit || 10;
                skip = query.skip || 0;
                const sort = query.sort || { created: -1 };
                let project = {};
                if (query.select) {
                    const fields = query.select.split(',');
                    fields.forEach((field) => {
                        project[field] = true;
                    });
                }
                delete query.limit;
                delete query.skip;
                delete query.sort;
                delete query.select;
                debug('db.index()', query);
                items = yield this.find(scope, query, limit, skip, sort, project);
                count = yield this.count(scope, query);
            }
            catch (err) {
                error(err.message);
            }
            return { items, limit, skip, count };
        });
    }
    /**
     * Perform a count of the amount of documents within a collection.
     * @param scope
     * @param query
     * @returns
     */
    count(scope_1) {
        return __awaiter(this, arguments, void 0, function* (scope, query = {}) {
            let count = 0;
            try {
                debug('db.count()', query);
                const collection = yield this.formCollection(scope);
                if (!collection) {
                    return 0;
                }
                count = yield collection.countDocuments(this.query(scope, query));
            }
            catch (err) {
                error(err.message);
            }
            return count;
        });
    }
    /**
     * Create a new record.
     */
    create(scope_1, record_1) {
        return __awaiter(this, arguments, void 0, function* (scope, record, allowFields = []) {
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
            const collection = yield this.formCollection(scope);
            try {
                debug('db.create()', record);
                const result = yield collection.insertOne((0, lodash_1.pick)(record, [
                    'data',
                    'metadata',
                    'modified',
                    'created',
                    'deleted',
                    'form',
                    'project',
                    'owner',
                    'access',
                    'state'
                ].concat(allowFields)));
                if (!result.insertedId) {
                    return null;
                }
                return yield this.read(scope, result.insertedId);
            }
            catch (err) {
                error(err.message);
            }
        });
    }
    /**
     * Return a query for a single mongo record.
     * @param {*} form
     * @param {*} id
     * @returns
     */
    query(scope, query = {}, subQuery = false) {
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
            query.deleted = { $eq: null };
        }
        // Handle nested queries.
        ['$or', '$and'].forEach((key) => {
            if (query[key]) {
                query[key].forEach((subQuery) => this.query(scope, subQuery, true));
            }
        });
        return query;
    }
    /**
     * Find many records that match a query.
     */
    find(scope_1) {
        return __awaiter(this, arguments, void 0, function* (scope, query = {}, limit = 10, skip = 0, sort = { created: -1 }, select = {}) {
            try {
                debug('db.find()', query);
                const collection = yield this.formCollection(scope);
                if (!collection) {
                    return [];
                }
                return yield collection.find(this.query(scope, query)).limit(limit).skip(skip).sort(sort).project(select).toArray();
            }
            catch (err) {
                error(err.message);
            }
            return [];
        });
    }
    /**
     * Find a record for a provided query.
     */
    findOne(scope_1) {
        return __awaiter(this, arguments, void 0, function* (scope, query = {}, options = {}) {
            try {
                debug('db.findOne()', query);
                const collection = yield this.formCollection(scope);
                if (!collection) {
                    return null;
                }
                return yield collection.findOne(this.query(scope, query));
            }
            catch (err) {
                error(err.message);
            }
            return null;
        });
    }
    /**
     * Read a single submission from a form
     *
     * @param {*} table
     * @param {*} query
     */
    read(scope, id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                debug('db.read()', id);
                const collection = yield this.formCollection(scope);
                if (!collection) {
                    return null;
                }
                return yield collection.findOne(this.query(scope, { _id: this.ObjectId(id) }));
            }
            catch (err) {
                error(err.message);
            }
            return null;
        });
    }
    /**
     * Update a single submission of a form.
     *
     * @param {*} table
     * @param {*} query
     */
    update(scope_1, id_1, update_1) {
        return __awaiter(this, arguments, void 0, function* (scope, id, update, allowFields = []) {
            if (!id || !update) {
                return null;
            }
            update.modified = new Date();
            try {
                debug('db.update()', id, update);
                const collection = yield this.formCollection(scope);
                if (!collection) {
                    return null;
                }
                const result = yield collection.updateOne(this.query(scope, { _id: this.ObjectId(id) }), {
                    $set: (0, lodash_1.pick)(update, ['data', 'metadata', 'modified', 'state'].concat(allowFields))
                });
                if (result.modifiedCount === 0) {
                    return null;
                }
                return yield this.read(scope, id);
            }
            catch (err) {
                error(err.message);
            }
            return null;
        });
    }
    /**
     * Delete a record from the database.
     */
    delete(scope, id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                return false;
            }
            try {
                debug('db.delete()', id);
                const collection = yield this.formCollection(scope);
                if (!collection) {
                    return false;
                }
                const result = yield collection.updateOne(this.query(scope, { _id: this.ObjectId(id) }), { $set: { deleted: Date.now() } });
                return result.modifiedCount > 0;
            }
            catch (err) {
                error(err.message);
            }
            return false;
        });
    }
    addPathQueryParams(pathQueryParams, query, path) {
        const pathArray = path.split(/\[\d+\]?./);
        const needValuesInArray = pathArray.length > 1;
        let pathToValue = path;
        if (needValuesInArray) {
            pathToValue = pathArray.shift();
            if (!pathToValue) {
                return;
            }
            const pathQueryObj = {};
            (0, lodash_1.reduce)(pathArray, (pathQueryPath, pathPart, index) => {
                const isLastPathPart = index === (pathArray.length - 1);
                const obj = (0, lodash_1.get)(pathQueryObj, pathQueryPath, pathQueryObj);
                const addedPath = `$elemMatch['${pathPart}']`;
                (0, lodash_1.set)(obj, addedPath, isLastPathPart ? pathQueryParams : {});
                return pathQueryPath ? `${pathQueryPath}.${addedPath}` : addedPath;
            }, '');
            query[pathToValue] = pathQueryObj;
        }
        else {
            query[pathToValue] = pathQueryParams;
        }
    }
    /**
     * Performs a unique query on the database to see if a value is unique.
     *  - If the value is unique, it returns true.
     *  - If the value is not unique, it returns the id of the non-unique submission.
     *  - If an error occurs, or uniqueness cannot be determined, it will throw an error.
     *
     * @param scope
     * @param context
     * @param value
     * @returns
     */
    isUnique(scope, context, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const { component, submission, form } = context;
            const path = `data.${context.path}`;
            // Build the query
            const query = { form: form._id };
            let options = {};
            if ((0, lodash_1.isString)(value)) {
                if (component.dbIndex) {
                    this.addPathQueryParams(value, query, path);
                }
                else if (component.type === 'email' ||
                    (component.type === 'textfield' &&
                        component.validate &&
                        component.validate.pattern === '[A-Za-z0-9]+')) {
                    this.addPathQueryParams(value, query, path);
                    options = { collation: { locale: 'en', strength: 2 } };
                }
                else {
                    this.addPathQueryParams({
                        $regex: new RegExp(`^${(0, core_1.escapeRegExCharacters)(value)}$`),
                        $options: 'i'
                    }, query, path);
                }
            }
            // FOR-213 - Pluck the unique location id
            else if ((0, lodash_1.isPlainObject)(value) &&
                value.address &&
                value.address['address_components'] &&
                value.address['place_id']) {
                this.addPathQueryParams({
                    $regex: new RegExp(`^${(0, core_1.escapeRegExCharacters)(value.address['place_id'])}$`),
                    $options: 'i'
                }, query, `${path}.address.place_id`);
            }
            // Compare the contents of arrays vs the order.
            else if ((0, lodash_1.isArray)(value)) {
                this.addPathQueryParams({ $all: value }, query, path);
            }
            else if ((0, lodash_1.isObject)(value) || (0, lodash_1.isNumber)(value)) {
                this.addPathQueryParams({ $eq: value }, query, path);
            }
            // Only search for non-deleted items
            query.deleted = { $eq: null };
            query.state = 'submitted';
            // Perform the query.
            let result = null;
            try {
                result = yield this.findOne(scope, query, options);
                if (!result || ((result === null || result === void 0 ? void 0 : result._id.toString()) === (submission === null || submission === void 0 ? void 0 : submission._id))) {
                    return true;
                }
                else {
                    return result._id.toString();
                }
            }
            catch (err) {
                if (options.collation) {
                    // presume this error comes from db compatibility, try again as regex
                    delete query[path];
                    this.addPathQueryParams({
                        $regex: new RegExp(`^${(0, core_1.escapeRegExCharacters)(value)}$`),
                        $options: 'i'
                    }, query, path);
                    try {
                        result = yield this.findOne(scope, query);
                        if (!result || ((result === null || result === void 0 ? void 0 : result._id.toString()) === (submission === null || submission === void 0 ? void 0 : submission._id))) {
                            return true;
                        }
                        else {
                            component.conflictId = result._id.toString();
                            return component.conflictId;
                        }
                    }
                    catch (err) {
                        throw err;
                    }
                }
                else {
                    throw err;
                }
            }
        });
    }
}
exports.Database = Database;
