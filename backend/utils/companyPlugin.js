const { DEFAULT_COMPANY, getCompany } = require('./companyContext');

const companyFilter = (company) => {
  if (company === DEFAULT_COMPANY) {
    return {
      $or: [
        { forCompany: company },
        { forCompany: { $exists: false } }
      ]
    };
  }

  return { forCompany: company };
};

const mergeCompanyFilter = (query, company) => {
  if (!company || query.forCompany) {
    return query;
  }

  return {
    $and: [
      query,
      companyFilter(company)
    ]
  };
};

function companyPlugin(schema) {
  schema.add({
    forCompany: {
      type: String,
      enum: ['mk_logistics', 'buts'],
      default: DEFAULT_COMPANY,
      index: true
    }
  });

  schema.pre('save', function(next) {
    if (!this.forCompany) {
      this.forCompany = getCompany();
    }
    next();
  });

  schema.pre('insertMany', function(next, docs) {
    const company = getCompany();
    docs.forEach((doc) => {
      if (!doc.forCompany) {
        doc.forCompany = company;
      }
    });
    next();
  });

  schema.pre(/^find/, function(next) {
    if (!this.getOptions().skipCompanyFilter) {
      this.setQuery(mergeCompanyFilter(this.getQuery(), getCompany()));
    }
    next();
  });

  schema.pre(['countDocuments', 'updateOne', 'updateMany'], function(next) {
    if (!this.getOptions().skipCompanyFilter) {
      this.setQuery(mergeCompanyFilter(this.getQuery(), getCompany()));
    }
    next();
  });

  schema.pre('aggregate', function(next) {
    const company = getCompany();
    const pipeline = this.pipeline();
    const firstStage = pipeline[0] || {};

    if (!firstStage.$match?.forCompany) {
      pipeline.unshift({ $match: companyFilter(company) });
    }

    next();
  });
}

module.exports = companyPlugin;
