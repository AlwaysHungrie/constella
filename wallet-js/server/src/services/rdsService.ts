import { generateDbCredentials } from '../utils/random'
import config from '../config'
const { Client, ClientConfig } = require('pg')

const { RDS_ENDPOINT, RDS_PORT, RDS_USERNAME, RDS_PASSWORD, RDS_CA } = config

// Base configuration for database connections
const getBaseClientConfig = (
  database: string,
  username = RDS_USERNAME,
  password = RDS_PASSWORD
): typeof ClientConfig => ({
  host: RDS_ENDPOINT,
  port: RDS_PORT,
  database,
  user: username,
  password,
  ssl: {
    require: true,
    rejectUnauthorized: false,
    ca: RDS_CA,
  },
})

// Common database operations
async function executeQuery(
  client: typeof Client,
  query: string,
  params: any[] = []
): Promise<any> {
  try {
    return await client.query(query, params)
  } catch (error) {
    console.error(`Query failed: ${query}`, error)
    throw error
  }
}

async function createClient(
  config: typeof ClientConfig
): Promise<typeof Client> {
  const client = new Client(config)
  await client.connect()
  return client
}

// Helper to grant privileges
async function grantPrivileges(
  client: typeof Client,
  dbName: string,
  dbUser: string
): Promise<void> {
  // Schema permissions
  await executeQuery(
    client,
    `GRANT CONNECT ON DATABASE "${dbName}" TO "${dbUser}"`
  )
  await executeQuery(client, `GRANT USAGE ON SCHEMA public TO "${dbUser}"`)

  // Table permissions
  await executeQuery(
    client,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${dbUser}"`
  )
  await executeQuery(
    client,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${dbUser}"`
  )

  // Sequence permissions
  await executeQuery(
    client,
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`
  )
  await executeQuery(
    client,
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "${dbUser}"`
  )
}

// Safe client cleanup
async function safelyCloseClient(client: typeof Client | null): Promise<void> {
  if (client) {
    try {
      await client.end()
    } catch (error) {
      console.error('Error closing client:', error)
    }
  }
}

export async function setupRdsDatabase(address: string, privateKey: string) {
  // Generate credentials
  const { dbName, dbUser, dbPassword } = generateDbCredentials(
    address,
    privateKey
  )

  const schemaName = `schema_${dbName}`

  // Track clients for cleanup
  let masterClient: typeof Client | null = null
  let dbClient: typeof Client | null = null
  let shadowDbClient: typeof Client | null = null

  try {
    console.log('Connecting to RDS instance...')
    masterClient = await createClient(getBaseClientConfig('postgres'))

    // Clean up existing resources
    await executeQuery(masterClient, `DROP DATABASE IF EXISTS "${dbName}"`)
    await executeQuery(
      masterClient,
      `DROP DATABASE IF EXISTS "${dbName}_shadow"`
    )
    await executeQuery(masterClient, `DROP SCHEMA IF EXISTS "${schemaName}"`)
    await executeQuery(masterClient, `DROP USER IF EXISTS "${dbUser}"`)

    // Create resources
    console.log(`Creating database: ${dbName}`)
    await executeQuery(masterClient, `CREATE DATABASE "${dbName}"`)
    await executeQuery(masterClient, `CREATE DATABASE "${dbName}_shadow"`)

    console.log(`Creating user: ${dbUser}`)
    await executeQuery(
      masterClient,
      `CREATE USER "${dbUser}" WITH ENCRYPTED PASSWORD '${dbPassword}'`
    )

    // Create schema
    console.log(`Creating schema: ${schemaName}`)
    await executeQuery(masterClient, `CREATE SCHEMA "${schemaName}"`)
    await executeQuery(
      masterClient,
      `GRANT ALL ON SCHEMA "${schemaName}" TO "${dbUser}"`
    )
    await executeQuery(
      masterClient,
      `ALTER USER "${dbUser}" SET search_path = "${schemaName}"`
    )

    // Grant privileges on both databases
    await executeQuery(
      masterClient,
      `GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}"`
    )
    await executeQuery(
      masterClient,
      `GRANT ALL PRIVILEGES ON DATABASE "${dbName}_shadow" TO "${dbUser}"`
    )

    // Close master connection
    await safelyCloseClient(masterClient)
    masterClient = null

    // Wait for changes to propagate
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Setup user permissions on both databases
    console.log('Setting up user permissions...')
    const userConfig = getBaseClientConfig(dbName, dbUser, dbPassword)
    const shadowConfig = getBaseClientConfig(
      `${dbName}_shadow`,
      dbUser,
      dbPassword
    )

    dbClient = await createClient(userConfig)
    shadowDbClient = await createClient(shadowConfig)

    // Apply permissions
    await grantPrivileges(dbClient, dbName, dbUser)
    await grantPrivileges(shadowDbClient, `${dbName}_shadow`, dbUser)

    console.log('Database setup complete!')

    return {
      dbName,
      dbUser,
      dbPassword,
    }
  } catch (err) {
    console.error('Error setting up database:', err)
    throw err
  } finally {
    // Clean up all clients
    await Promise.all([
      safelyCloseClient(masterClient),
      safelyCloseClient(dbClient),
      safelyCloseClient(shadowDbClient),
    ])
  }
}

export async function deleteRdsDatabase(dbName: string, dbUser: string) {
  console.log('Deleting RDS database...', dbName, dbUser)
  const schemaName = `schema_${dbName}`

  let masterClient: typeof Client | null = null
  try {
    masterClient = await createClient(getBaseClientConfig('postgres'))
    await executeQuery(masterClient, `DROP DATABASE IF EXISTS "${dbName}"`)
    await executeQuery(
      masterClient,
      `DROP DATABASE IF EXISTS "${dbName}_shadow"`
    )
    await executeQuery(masterClient, `DROP SCHEMA IF EXISTS "${schemaName}"`)
    await executeQuery(masterClient, `DROP USER IF EXISTS "${dbUser}"`)
  } catch (err) {
    console.error('Error deleting database:', err)
    throw err
  } finally {
    await safelyCloseClient(masterClient)
  }
}
