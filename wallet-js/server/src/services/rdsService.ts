import { generateDbCredentials } from '../utils/random'

const { Client } = require('pg')
import config from '../config'

const { RDS_ENDPOINT, RDS_PORT, RDS_USERNAME, RDS_PASSWORD, RDS_CA } = config

export async function setupRdsDatabase(address: string, privateKey: string) {
  // New database and user details
  const { dbName, dbUser, dbPassword } = generateDbCredentials(
    address,
    privateKey
  )

  // Connect to the default postgres database as master user
  const masterClient = new Client({
    host: RDS_ENDPOINT,
    port: RDS_PORT,
    database: 'postgres', // Connect to default database first
    user: RDS_USERNAME,
    password: RDS_PASSWORD,
    ssl: {
      require: true,
      rejectUnauthorized: false,
      ca: RDS_CA,
    },
  })

  let dbClient: any | null = null

  try {
    console.log('Connecting to RDS instance...')
    await masterClient.connect()

    // drop the database if it exists
    await masterClient.query(`DROP DATABASE IF EXISTS "${dbName}"`)
    await masterClient.query(`DROP USER IF EXISTS "${dbUser}"`)

    // Create a new database
    console.log(`Creating database: ${dbName}`)
    await masterClient.query(`CREATE DATABASE "${dbName}"`)

    // Create a new user
    console.log(`Creating user: ${dbUser}`)
    const createUserRes = await masterClient.query(
      `CREATE USER "${dbUser}" WITH ENCRYPTED PASSWORD '${dbPassword}'`
    )
    console.log('createUserRes', createUserRes)
    await masterClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}"`
    )

    // Disconnect from default database
    await masterClient.end()

    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Connect to the newly created database to set permissions
    console.log(
      'Connecting to RDS instance...',
      RDS_ENDPOINT,
      RDS_PORT,
      dbName,
      dbUser,
      dbPassword
    )
    dbClient = new Client({
      host: RDS_ENDPOINT,
      port: RDS_PORT,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      ssl: {
        require: true,
        rejectUnauthorized: false,
        ca: RDS_CA,
      },
    })

    await dbClient.connect()

    // Grant privileges to the new user on the specific database
    console.log('Setting up user permissions...')

    // Schema permissions
    await dbClient.query(`GRANT CONNECT ON DATABASE "${dbName}" TO "${dbUser}"`)
    await dbClient.query(`GRANT USAGE ON SCHEMA public TO "${dbUser}"`)

    // Table permissions
    await dbClient.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${dbUser}"`
    )
    await dbClient.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${dbUser}"`
    )

    // Sequence permissions
    await dbClient.query(
      `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO "${dbUser}"`
    )
    await dbClient.query(
      `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO "${dbUser}"`
    )

    console.log('Database setup complete!')
    console.log(
      `Your connection string: postgresql://${dbUser}:${dbPassword}@${RDS_ENDPOINT}:${RDS_PORT}/${dbName}?schema=public`
    )
    const connectionString = `postgresql://${dbUser}:${dbPassword}@${RDS_ENDPOINT}:${RDS_PORT}/${dbName}?schema=public`

    return {
      dbName,
      dbUser,
      dbPassword,
      connectionString,
    }
  } catch (err) {
    console.error('Error setting up database:', err)
    throw err
  } finally {
    if (masterClient) await masterClient.end().catch(console.error)
    if (dbClient) await dbClient.end().catch(console.error)
  }
}

export async function deleteRdsDatabase(dbName: string, dbUser: string) {
  console.log('Deleting RDS database...', dbName, dbUser)
  const masterClient = new Client({
    host: RDS_ENDPOINT,
    port: RDS_PORT,
    database: 'postgres',
    user: RDS_USERNAME,
    password: RDS_PASSWORD,
    ssl: {
      require: true,
      rejectUnauthorized: false,
      ca: RDS_CA,
    },
  })

  await masterClient.connect()
  await masterClient.query(`DROP DATABASE "${dbName}"`)
  await masterClient.query(`DROP USER "${dbUser}"`)
  await masterClient.end()
}
