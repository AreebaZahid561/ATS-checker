'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Global in-memory storage, keyed by model name
const dbStore = {};
// Global registry of all registered models
const modelsMap = {};

class MockSchema {
  constructor(definition, options) {
    this.definition = definition || {};
    this.options = options || {};
    this.methods = {};
    this.statics = {};
    this.preHooks = {};
    this.virtuals = {};
  }

  pre(hookName, fn) {
    this.preHooks[hookName] = this.preHooks[hookName] || [];
    this.preHooks[hookName].push(fn);
  }

  virtual(name, config) {
    this.virtuals[name] = config;
    return {
      get() {},
      set() {}
    };
  }
}

// Support mongoose.Schema.Types.ObjectId
MockSchema.Types = {
  ObjectId: 'ObjectId'
};

// Generate MongoDB-like hex IDs
function generateId() {
  return crypto.randomBytes(12).toString('hex');
}

function clone(obj) {
  if (obj === null || obj === undefined) return obj;
  return JSON.parse(JSON.stringify(obj));
}

// Evaluate query matching
function matchesQuery(doc, query) {
  for (const [key, value] of Object.entries(query)) {
    const docValue = doc[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [op, opVal] of Object.entries(value)) {
        if (op === '$gt') {
          if (!(docValue > opVal)) return false;
        } else if (op === '$lt') {
          if (!(docValue < opVal)) return false;
        } else if (op === '$gte') {
          if (!(docValue >= opVal)) return false;
        } else if (op === '$lte') {
          if (!(docValue <= opVal)) return false;
        } else {
          if (JSON.stringify(docValue) !== JSON.stringify(opVal)) return false;
        }
      }
    } else {
      if (docValue !== value) {
        if (String(docValue) !== String(value)) return false;
      }
    }
  }
  return true;
}

class MockDocument {
  constructor(model, data, selectFields = [], isQuery = false, isNew = false) {
    this._model = model;
    
    Object.defineProperty(this, 'isNew', {
      value: isNew,
      writable: true,
      enumerable: false
    });

    // Assign fields
    Object.assign(this, clone(data));

    // Handle selection and defaults
    const schema = model.schema;

    Object.defineProperty(this, '_rawRecord', {
      value: clone(data),
      writable: true,
      enumerable: false
    });

    if (isQuery) {
      const defaultSelected = {};
      for (const [field, config] of Object.entries(schema.definition)) {
        if (config && config.select === false) {
          defaultSelected[field] = false;
        } else {
          defaultSelected[field] = true;
        }
      }

      const selectedMap = { ...defaultSelected };
      let overrideSelect = false;

      for (const f of selectFields) {
        if (f.startsWith('+')) {
          selectedMap[f.substring(1)] = true;
        } else if (f.startsWith('-')) {
          selectedMap[f.substring(1)] = false;
        } else {
          if (!overrideSelect) {
            overrideSelect = true;
            for (const key of Object.keys(selectedMap)) {
              if (key !== '_id') selectedMap[key] = false;
            }
          }
          selectedMap[f] = true;
        }
      }

      for (const [field, isSelected] of Object.entries(selectedMap)) {
        if (!isSelected && field in this) {
          delete this[field];
        }
      }
    }

    // Attach custom methods
    for (const [methodName, methodFn] of Object.entries(schema.methods)) {
      this[methodName] = methodFn.bind(this);
    }
  }

  get id() {
    return this._id ? String(this._id) : undefined;
  }

  isModified(path) {
    if (this.isNew) {
      return true;
    }
    if (path === 'password') {
      return this.password !== this._rawRecord.password;
    }
    return true;
  }

  async save(options = {}) {
    // Run pre hooks
    const preHooks = this._model.schema.preHooks['save'] || [];
    for (const hook of preHooks) {
      await new Promise((resolve, reject) => {
        let called = false;
        const next = (err) => {
          if (called) return;
          called = true;
          if (err) reject(err);
          else resolve();
        };
        const result = hook.call(this, next);
        if (result && typeof result.then === 'function') {
          result.then(() => next()).catch(reject);
        }
      });
    }

    // Merge changes
    const updatedData = { ...this._rawRecord };
    for (const [key, val] of Object.entries(this)) {
      if (key.startsWith('_')) continue;
      updatedData[key] = val;
    }

    const now = new Date();
    if (!updatedData.createdAt) {
      updatedData.createdAt = now;
    }
    updatedData.updatedAt = now;

    // Save back to dbStore
    const store = dbStore[this._model.modelName];
    const index = store.findIndex(d => String(d._id) === String(this._id));
    if (index !== -1) {
      store[index] = updatedData;
    } else {
      store.push(updatedData);
    }

    Object.assign(this, clone(updatedData));
    this._rawRecord = clone(updatedData);
    this.isNew = false;

    return this;
  }

  toJSON() {
    const obj = { ...this };
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'function' || key.startsWith('_')) {
        delete obj[key];
      }
    }
    if (this._model.schema.options && this._model.schema.options.toJSON && typeof this._model.schema.options.toJSON.transform === 'function') {
      return this._model.schema.options.toJSON.transform(this, obj);
    }
    return obj;
  }
}

class MockQuery {
  constructor(model, filterFn) {
    this.model = model;
    this.filterFn = filterFn;
    this._selectFields = [];
    this._sortFields = null;
    this._skipCount = 0;
    this._limitCount = null;
    this._populatePaths = [];
  }

  select(selectStr) {
    if (selectStr) {
      this._selectFields = selectStr.split(/\s+/).filter(Boolean);
    }
    return this;
  }

  sort(sortObj) {
    this._sortFields = sortObj;
    return this;
  }

  skip(count) {
    this._skipCount = Number(count) || 0;
    return this;
  }

  limit(count) {
    this._limitCount = Number(count);
    return this;
  }

  populate(path) {
    if (path) {
      this._populatePaths.push(path);
    }
    return this;
  }

  async execute() {
    let docs = this.filterFn();

    // Sort
    if (this._sortFields) {
      const entries = Object.entries(this._sortFields);
      if (entries.length > 0) {
        const [field, order] = entries[0];
        docs.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return order === -1 ? 1 : -1;
          if (valA > valB) return order === -1 ? -1 : 1;
          return 0;
        });
      }
    }

    // Skip/Limit
    if (this._skipCount) {
      docs = docs.slice(this._skipCount);
    }
    if (this._limitCount !== null && this._limitCount !== undefined) {
      docs = docs.slice(0, this._limitCount);
    }

    // Populate virtual or ref fields
    for (const path of this._populatePaths) {
      for (const doc of docs) {
        await this.model._populateDoc(doc, path);
      }
    }

    return docs.map(doc => this.model._instantiate(doc, this._selectFields, true));
  }

  then(onFulfilled, onRejected) {
    return this.execute().then(onFulfilled, onRejected);
  }
}

class MockModel {
  constructor(modelName, schema) {
    this.modelName = modelName;
    this.schema = schema;

    if (!dbStore[modelName]) {
      dbStore[modelName] = [];
    }

    // Copy statics
    for (const [staticName, staticFn] of Object.entries(schema.statics)) {
      this[staticName] = staticFn.bind(this);
    }
  }

  _instantiate(data, selectFields = [], isQuery = false, isNew = false) {
    if (!data) return null;
    const docData = clone(data);
    for (const [field, config] of Object.entries(this.schema.definition)) {
      if (docData[field] === undefined || docData[field] === null) {
        if (config && config.default !== undefined) {
          docData[field] = typeof config.default === 'function' ? config.default() : config.default;
        }
      }
    }
    return new MockDocument(this, docData, selectFields, isQuery, isNew);
  }

  async _populateDoc(doc, path) {
    if (path === 'parsedData' && this.modelName === 'Resume') {
      const parsedModel = modelsMap['ParsedResume'];
      if (parsedModel) {
        const parsed = dbStore['ParsedResume'].find(d => String(d.resume) === String(doc._id));
        if (parsed) {
          doc.parsedData = parsedModel._instantiate(parsed);
        } else {
          doc.parsedData = null;
        }
      }
    }
  }

  async create(data) {
    const rawDocs = Array.isArray(data) ? data : [data];
    const createdDocs = [];

    for (const rawDoc of rawDocs) {
      const docData = clone(rawDoc);
      if (!docData._id) {
        docData._id = generateId();
      }
      const doc = this._instantiate(docData, [], false, true);
      createdDocs.push(doc);
    }

    const savePromises = createdDocs.map(doc => doc.save());
    if (Array.isArray(data)) {
      return Promise.all(savePromises);
    } else {
      return savePromises[0];
    }
  }

  find(query = {}) {
    return new MockQuery(this, () => {
      const store = dbStore[this.modelName] || [];
      return store.filter(doc => matchesQuery(doc, query));
    });
  }

  findOne(query = {}) {
    const mq = new MockQuery(this, () => {
      const store = dbStore[this.modelName] || [];
      const match = store.find(doc => matchesQuery(doc, query));
      return match ? [match] : [];
    });
    const originalExecute = mq.execute.bind(mq);
    mq.execute = async () => {
      const results = await originalExecute();
      return results.length > 0 ? results[0] : null;
    };
    return mq;
  }

  findById(id) {
    return this.findOne({ _id: id });
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  }

  async findOneAndUpdate(query, update, options = {}) {
    const store = dbStore[this.modelName] || [];
    let rawDoc = store.find(doc => matchesQuery(doc, query));

    if (!rawDoc) {
      if (options.upsert) {
        const newRaw = { ...query, ...update };
        if (!newRaw._id) {
          newRaw._id = generateId();
        }
        const inst = this._instantiate(newRaw);
        await inst.save();
        return inst;
      }
      return null;
    }

    const fieldsToUpdate = update.$set || update;
    Object.assign(rawDoc, fieldsToUpdate);
    rawDoc.updatedAt = new Date();

    const inst = this._instantiate(rawDoc);
    await inst.save();
    return inst;
  }

  async deleteOne(query = {}) {
    const store = dbStore[this.modelName] || [];
    const index = store.findIndex(doc => matchesQuery(doc, query));
    if (index !== -1) {
      store.splice(index, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query = {}) {
    const store = dbStore[this.modelName] || [];
    let deletedCount = 0;
    dbStore[this.modelName] = store.filter(doc => {
      if (matchesQuery(doc, query)) {
        deletedCount++;
        return false;
      }
      return true;
    });
    return { deletedCount };
  }

  async countDocuments(query = {}) {
    const store = dbStore[this.modelName] || [];
    return store.filter(doc => matchesQuery(doc, query)).length;
  }
}

const mongooseMock = {
  Schema: MockSchema,
  model(name, schemaInstance) {
    if (modelsMap[name]) {
      return modelsMap[name];
    }
    const model = new MockModel(name, schemaInstance);
    modelsMap[name] = model;
    return model;
  },
  connection: {
    on(event, cb) {
      // Mock event listener
    },
    async dropDatabase() {
      // Clear dbStore collections
      for (const key of Object.keys(dbStore)) {
        dbStore[key] = [];
      }
      return true;
    },
    async close() {
      return true;
    }
  },
  connect() {
    return Promise.resolve(true);
  },
  Types: {
    ObjectId(id) {
      return id || generateId();
    }
  }
};

module.exports = mongooseMock;
