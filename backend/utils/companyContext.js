const { AsyncLocalStorage } = require('async_hooks');

const DEFAULT_COMPANY = 'buts';
const COMPANIES = {
  mk_logistics: 'MK LOGISTICS',
  buts: 'BUTS'
};

const storage = new AsyncLocalStorage();

const normalizeCompany = (value) => {
  const normalized = String(value || DEFAULT_COMPANY).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(COMPANIES, normalized)
    ? normalized
    : DEFAULT_COMPANY;
};

const getCompany = () => storage.getStore()?.company || DEFAULT_COMPANY;

const companyMiddleware = (req, res, next) => {
  const requestedCompany = req.headers['x-company'] || req.query.forCompany || req.body?.forCompany;
  const company = normalizeCompany(requestedCompany);

  req.company = company;
  req.companyName = COMPANIES[company];

  if (req.body && ['POST'].includes(req.method)) {
    req.body.forCompany = company;
  }

  storage.run({ company }, next);
};

module.exports = {
  COMPANIES,
  DEFAULT_COMPANY,
  companyMiddleware,
  getCompany,
  normalizeCompany
};
