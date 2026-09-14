// server/core/base.service.js

export class BaseService {
  constructor(model) {
    this.model = model;
  }

  async findById(id, select = "") {
    return await this.model.findById(id).select(select);
  }

  async findOne(query = {}, select = "") {
    return await this.model.findOne(query).select(select);
  }

  async findAll(query = {}, select = "", sort = {}) {
    return await this.model.find(query).select(select).sort(sort);
  }

  async create(data) {
    return await this.model.create(data);
  }

  async updateById(id, data, options = { new: true, runValidators: true }) {
    return await this.model.findByIdAndUpdate(id, data, options);
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async count(query = {}) {
    return await this.model.countDocuments(query);
  }
}
