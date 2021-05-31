const update = ({ sObject, sObjectId, payload, apiVersion }) => {
  return fetch_({ method: METHODS.PATCH, payload, sObject, sObjectId, apiVersion });
}
Object.defineProperty(this, 'update', {value: update, enumerable : true});

const batchUpdate = ({ sObject, sObjectId, payload, apiVersion }) => {
  return fetch_({ batch: true, method: METHODS.PATCH, payload, sObject, sObjectId, apiVersion });
}
Object.defineProperty(this, 'batchUpdate', {value: batchUpdate, enumerable : true});

updateApplication = (applicationId, payload, apiVersion = 50) => {
  return update({ sObject: 'Opportunity', sObjectId: applicationId, payload: payload, apiVersion: apiVersion });
}