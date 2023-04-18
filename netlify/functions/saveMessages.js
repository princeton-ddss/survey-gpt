import { Create, Client, Collection } from 'faunadb';

const secret = process.env.FAUNA_SERVER_KEY
var endpoint = process.env.FAUNADB_ENDPOINT
if (typeof secret === 'undefined' || secret === '') {
  console.error('The FAUNADB_SECRET environment variable is not set, exiting.')
  process.exit(1)
}

if (!endpoint) endpoint = 'https://db.fauna.com/'
var mg, domain, port, scheme
if ((mg = endpoint.match(/^(https?):\/\/([^:]+)(:(\d+))?/))) {
  scheme = mg[1] || 'https'
  domain = mg[2] || 'db.fauna.com'
  port = mg[4] || 443
}

const client = new Client({
  secret: secret,
  domain: domain,
  port: port,
  scheme: scheme,
})

exports.handler = async function (event) {
    const request = JSON.parse(event.body);
    const response = await client.query(
        Create(
            Collection("surveys"),
            {
                ts: Date.now(),
                data: {
                    "session": request.session,
                    "messages": request.messages,
                }
            }
        )
    )
    try {
        return {
            statusCode: 200,
            body: JSON.stringify(response),
        }
    } catch (error) {
        console.error(`Error [${error.name}]: ${error.message}`);
    }
}
