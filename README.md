# Query Backend

This service allows to run SQL queries on the database.

## Usage
See the [ndb-setup repo](https://github.com/Aam-Digital/ndb-setup) for full deployment instructions.

To use this you need a running [CouchDB](https://docs.couchdb.org/en/stable/) and [structured query server (SQS)](https://neighbourhood.ie/products-and-services/structured-query-server).

The following variables might need to be configured in the `.env` file:
- `DATABASE_URL` URL of the `CouchDB` or [replication backend](https://github.com/Aam-Digital/replication-backend)
- `QUERY_URL` URL of the SQS
- `SCHEMA_CONFIG_ID` database ID of the document which holds the SQS schema (default `_design/sqlite:config`)
- `PORT` where the app should listen (default 3000)
- `SENTRY_DSN` for remote logging
