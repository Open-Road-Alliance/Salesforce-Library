# Salesforce Library (Google Apps Script)

Wrapper to facilitate communcation between Google Apps Script and Salesforce APIs.

## Setup

Because this library depends on a number of tokens, it cannot be installed like a traditional Google Apps Script Library. A future version of this library will facilitate passing secrets after installing the library, but, for now, the library must be managed manually.

### Installing files

The library can of course be installed manually, but the quickest method might be via `clasp`:

1. Create a new script file in Google Drive (take note of the script ID)
2. Clone this repo using `git clone`
3. Modify the `.clasp.json` file with the script ID from step 1
4. Add secrets (see the next section)
5. Use `clasp push`

### Creating secrets

After installing the files locally, you'll want to create a `Secrets.js` file that contains the authorization details for communicating with the Salesforce APIs. Salesforce supports authentication via a number of methods, but this library currently only supports [Server-to-Server JWT authentication](https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&type=5).

To get these secrets, you'll need to do a bit of work on the [Salesforce side](https://blog.deadlypenguin.com/2019/03/08/jwt-bearer-auth-salesforce-node/):

#### 1. Generate an x509 certificate and key

This can be accomplished by entering the following command into a command prompt or terminal window:
`openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out certificate.pem`

- `openssl` is a command line library that handles security protocols, [find more information here](https://github.com/openssl/openssl).
- `req` is the command within the `openssl` library that handles certificate requests
- `-newkey`is the option that specifically creates a new certificate request and a new private key
  - `rsa:2048` specifies the type of key (`rsa`) and the size of the key (in bits)
- `-nodes` redundant with `noenc`, specifies that the resultant key will not be encrypted
- `keyout` is the option that specifies the filename to write the private key to
  - `key.pem` the name of the key file
- `x509`is the option that outputs a certificate instead of a certificate request. X.509 is simply a standard format for public key certificates
  - `days` is the option that specifies the number of days to certify the certificate for
  - `365` the number of days to certify the certificate for\*
  - `-out` this option specifies the output filename to write to (in this case for the certificate)

\*Note that this example generates a certificate that expires within a year. After that, the Key/Certificate will need to be regenerated and re-authorized. It's possible to set this to an arbitrarily high number, but that's not usually a security best practice.

If you do not know if you have `openssl` on your computer, try tunning `openssl version` in a command prompt. If you get back a version number, then you are all set. Otherwise, check out the download instructions [here](https://github.com/openssl/openssl) or [here](https://www.cloudinsidr.com/content/how-to-install-the-most-recent-version-of-openssl-on-windows-10-in-64-bit/).

#### 2. Create a connected app via Salesforce

To do this, go to:

1. Setup > Apps > App Manager > New Connected App
2. Fill out the following details: Name, Contact Email
3. Select _Enable OAuth Settings_
4. Select _Enable for Device Flow_
5. Select _Use digital signatures_
6. Upload the `certificates.pem` file generated via OpenSSL above
7. Choose the necessary OAuth scopes for your app (full access covers all scopes except for refresh_token)
8. Click _Save_
9. On the next screen, go to Manage > Edit Policies and set Permitted Users to _Admin approved users and pre-authorized_ and click Save
10. Click on Manage Profiles and add the profiles that should have access to this app and click Save

#### 3. Authenticate against the connected app one time

We always have to manually authorize the app once before we can release it (even though we are specifiying profiles and other permissions in the previous step). To do this enter the following command into your command prompt:

`curl -X GET -D - -o /dev/null "https://login.salesforce.com/services/oauth2/authorize?response_type=code&redirect_uri=https://login.salesforce.com/services/oauth2/success&client_id=<CONSUMER_KEY>"`

Make sure to replace `<CONSUMER_KEY>` with the consumer key from your Connected App

- `curl` is a command line tool to transfer data to or from a server
- `-X` (same as `--request`) specifies a custom request method (ie GET, POST, PATCH, etc)
  - `GET` the request method to use
- `-D` (same as `--dump-header`) writes the received protocol headers to the specified file
  - `-` normally you want to pass a file name with `dump-header`, but passing a hyphen dumps headers to the command prompt
- `-o` (same as `--output`) writes the output to the specified file
  - `/dev/null/` normally you want to pass a file name with `output` to collect the html, but passing this ignores the html
- `https://login...` the URL to hit

#### 4. Visit the Location URL from the response headers in your browser

In your command prompt, you should see a lot of headers. If the curl request was successful, one of the headers should be a `Location URL`. Visit this URL in your browser. This should authenticate your user and redirect you to a URL with a `code` parameter in the URL (you should literally inspect the URL in the address bar to grab the code parameter). Copy that code for the next step.

It takes some time for the connected app to work (between 2 and 10 minutes), so if you constantly get a `400 Bad Request` error, wait a few minutes and try again.

#### 5. Complete authentication using the code from the previous step

With the `code` value from the previous step and use the following curl request:

`curl -X POST "https://login.salesforce.com/services/oauth2/token?grant_type=authorization_code&redirect_uri=https://login.salesforce.com/services/oauth2/success&client_secret=<CONSUMER_SECRET>&client_id=<CONSUMER_KEY>&code=<CODE>"`

`<CONSUMER_SECRET>` and `<CONSUMER_KEY>` will come from the connected app. `<CODE>` will come from the redirect URL from the previous step.

You should now be able to succcessfully make JWT requests for other users without having to authorize the application.

### Adding secrets to directory

Now that you've generated your secrets and setup your app for JWT authentication, you've got the secrets you need to be able to use this library. Create a new file in your google script directory titled `Secrets.js` with the following contents:

```javascript
const CONSUMER_KEY = "<<CONSUMER_KEY>>";
const CONSUMER_SECRET = "<<CONSUMER_SECRET>>";
const USERNAME = "<<USERNAME>>";
const PRIVATE_KEY_FILE_ID = "<<PRIVATE_KEY_FILE_ID>>";
```

`<<CONSUMER_KEY>>` and `<<CONSUMER_SECRET>>` come from your connected app. `<<USERNAME>>` refers to the user who originally set up JWT authentication. `<<PRIVATE_KEY_FILE_ID>>` refers to the ID of the `key.pem` file in Google Drive (this is the same `key.pem` file generated via the OpenSSL command). These secrets and files are also available via 1Password (within the Data & IT Vault).

## Usage

With everything installed, you can use this library to:

- Insert records
- Batch insert records
- Get records
- Update records
- Batch update records

### Get Requests

To make any get requests, you'll need to leverage the `quereyParameters` class to build the SOQL query. `queryParameters` supports most [SOQL syntax](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_select.htm) including:

- Select (specifies desired fields) _Required_
- From (specifies the source object) _Required_
- Where (selects records that explicitly meet these criteria)
- Group By (groups records in order to aggregate metrics)
- Order By (sorts records according to these rules)
- Limit (specifies the maximum number of records to return)
- Offset (works with Limit to skip results)
- Having (similar to the Where clause, but selects records that meet criteria _after_ aggregation has occurred)

For example, if you wanted to see which accounts that are closing today have opportunities greater than $100,000, you might do something like this:

```javascript
const qp = new QueryParameters();
qp.setSelect("Account.Name, SUM(Amount)");
qp.setFrom("Opportunity");
qp.setWhere("CloseDate = TODAY");
qp.setGroupBy("Account.Name");
qp.setOrderBy("Account.Name");
qp.setLimit(100);
qp.setOffset(10);
qp.sethaving("SUM(Amount) > 100000");
```

Which translates to:

```sql
Select Account.Name, SUM(Amount)
FROM Opportunity
WHERE CloseDate = TODAY
GROUP BY Account.Name
ORDER BY Account.Name
LIMIT 100
OFFSET 10
HAVING SUM(Amount) > 100000
```

Running the request is a simple as running the following command:

```javascript
const records = get(qp);
```

### Inserting and updating

Updating and inserting records work similarly. The primary difference is that you must specify a record ID when updating a record, whereas this is not the case when purely inserting, as the expectation is that a new record will be created after the insert.

For both upsert and insert operations, the payloads work the same way. For individual records, simply specify the fields to be updated (when inserting a new record make sure to specify required fields):

```json
{
  "Name": "California Wheat Corporation",
  "Type": "New Customer"
}
```

For batch or nested requests, checkout the Batch or nested requests section.

### API versions

By default, this library uses api version 50.0, but that can be overridden by passing in the `apiVersion` parameter with any request.

### Batch or nested requests

Batch requests are handled a little differently on the backend as they hit a different endpoint. Batch requests are particularly useful when updating or inserting many records at once as well as updating or inserting individual records with lots of connections / children. The payload for batch requests must follow the following [format](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_composite_sobject_tree_flat.htm):

```json
{
  "records": [
    {
      "attributes": { "type": "Account", "referenceId": "ref1" },
      "name": "SampleAccount1",
      "phone": "1111111111",
      "website": "www.salesforce.com",
      "numberOfEmployees": "100",
      "industry": "Banking"
    },
    {
      "attributes": { "type": "Account", "referenceId": "ref2" },
      "name": "SampleAccount2",
      "phone": "2222222222",
      "website": "www.salesforce2.com",
      "numberOfEmployees": "250",
      "industry": "Banking"
    }
  ]
}
```

`referenceId` can be whatever value you want, but it must be unique across all records within the current request. The purpose is to help you map individual responses back to your original request.

## Dependencies

- [JWT Library](https://github.com/Open-Road-Alliance/JWT-Library) - Library that supports JWT authentication
- [Global Helpers Library](https://github.com/Open-Road-Alliance/Global-Google-Script-Helpers)- Simple library with some universal helper methods

## Additional Resources

- [JWT Bearer Authentication with Salesforce](https://blog.deadlypenguin.com/2019/03/08/jwt-bearer-auth-salesforce-node/)
- [Server-to-Server Integration with Salesforce](https://help.salesforce.com/articleView?id=sf.remoteaccess_oauth_jwt_flow.htm&type=5)
- [OpenSSL](https://github.com/openssl/openssl)
- [X.509 Certificate](https://www.ssl.com/faqs/what-is-an-x-509-certificate/)
- [Install OpenSSL](https://www.cloudinsidr.com/content/how-to-install-the-most-recent-version-of-openssl-on-windows-10-in-64-bit/)
- [SOQL Syntax](https://developer.salesforce.com/docs/atlas.en-us.soql_sosl.meta/soql_sosl/sforce_api_calls_soql_select.htm)
- [Create Multiple Records](https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/dome_composite_sobject_tree_flat.htm)
