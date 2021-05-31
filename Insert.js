const insert = ({ sObject, payload, apiVersion }) => {
  return fetch_({ method: METHODS.POST, payload, sObject, apiVersion });
}
Object.defineProperty(this, 'insert', {value: insert, enumerable : true});

const batchInsert = ({ sObject, payload, apiVersion }) => {
  return fetch_({ batch: true, method: METHODS.POST, payload, sObject, apiVersion });
}
Object.defineProperty(this, 'batchInsert', {value: batchInsert, enumerable : true});