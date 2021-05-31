/**
 * Generates the SOQL query to send to Salesforce
 *
 * @param {QueryParameters} queryParameters an object specifying query parameters
 *                                  must at least specify the SELECT and FROM clauses
 * @return {obj} the queried data from Salesforce
 */
const get = (queryParameters, apiVersion) => {
  return fetch_({ method: METHODS.GET, queryParameters: queryParameters, apiVersion: apiVersion });
}
Object.defineProperty(this, 'get', {value: get, enumerable : true});
// ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT', 'OFFSET', 'HAVING']
// A base class is defined using the new reserved 'class' keyword
class QueryParameters {

  constructor() {
    this.select = 'Id, Name';
    this.from = 'Opportunity';
  }

  setSelect(select) {
    this.select = select;

    return this;
  }
  setFrom(from) {
    this.from = from;

    return this;
  }
  setWhere(where) {
    this.where = where;

    return this;
  }
  setGroupBy(groupBy) {
    this.groupBy = groupBy;

    return this;
  }
  setOrderBy(orderBy) {
    this.orderBy = orderBy;

    return this;
  }
  setLimit(limit) {
    this.limit = limit;

    return this;
  }
  setOffset(offset) {
    this.offset = offset;

    return this;
  }
  setHaving(having) {
    this.having = having;

    return this;
  }
}
Object.defineProperty(this, 'QueryParameters', {value: QueryParameters, enumerable : true});