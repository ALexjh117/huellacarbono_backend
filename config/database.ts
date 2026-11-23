import app from '@adonisjs/core/services/app'
import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const isTest = process.env.NODE_ENV === 'test'
const testDatabase = {
  host: env.get('TEST_DB_HOST'),
  port: env.get('TEST_DB_PORT'),
  user: env.get('TEST_DB_USER'),
  password: env.get('TEST_DB_PASSWORD'),
  database: env.get('TEST_DB_DATABASE'),
}

if (isTest) {
  const localHosts = new Set(['127.0.0.1', 'localhost', '::1'])
  if (
    !testDatabase.host ||
    !localHosts.has(testDatabase.host.toLowerCase()) ||
    testDatabase.port !== 5432 ||
    testDatabase.user !== 'huellacarbono_test' ||
    testDatabase.database !== 'huellacarbono_test' ||
    testDatabase.database === env.get('DB_DATABASE') ||
    testDatabase.user === env.get('DB_USER')
  ) {
    throw new Error(
      'Pruebas detenidas: configure TEST_DB_* para PostgreSQL local dedicado (usuario y base huellacarbono_test). No se usará DB_*.'
    )
  }
} else if (
  !env.get('DB_HOST') ||
  !env.get('DB_PORT') ||
  !env.get('DB_USER') ||
  !env.get('DB_DATABASE')
) {
  throw new Error('Falta configurar DB_* para la conexión PostgreSQL de la aplicación.')
}

const connection = isTest
  ? testDatabase
  : {
      host: env.get('DB_HOST'),
      port: env.get('DB_PORT'),
      user: env.get('DB_USER'),
      password: env.get('DB_PASSWORD'),
      database: env.get('DB_DATABASE'),
    }

const dbConfig = defineConfig({
  /**
   * Default connection used for all queries.
   */
  connection: 'pg',

  connections: {
    /**
     * PostgreSQL connection.
     */
    pg: {
      client: 'pg',
      connection,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      schemaGeneration: {
        enabled: true,
        rulesPaths: ['./database/schema_rules.js'],
      },
      debug: app.inDev,
    },

    /**
     * MySQL / MariaDB connection.
     * Install package to switch: npm install mysql2
     */
    // mysql: {
    //   client: 'mysql2',
    //   connection: {
    //     host: env.get('DB_HOST'),
    //     port: env.get('DB_PORT'),
    //     user: env.get('DB_USER'),
    //     password: env.get('DB_PASSWORD'),
    //     database: env.get('DB_DATABASE'),
    //   },
    //   migrations: {
    //     naturalSort: true,
    //     paths: ['database/migrations'],
    //   },
    //   schemaGeneration: {
    //     enabled: true,
    //     rulesPaths: ['./database/schema_rules.js'],
    //   },
    //   debug: app.inDev,
    // },

    /**
     * Microsoft SQL Server connection.
     * Install package to switch: npm install tedious
     */
    // mssql: {
    //   client: 'mssql',
    //   connection: {
    //     server: env.get('DB_HOST'),
    //     port: env.get('DB_PORT'),
    //     user: env.get('DB_USER'),
    //     password: env.get('DB_PASSWORD'),
    //     database: env.get('DB_DATABASE'),
    //   },
    //   migrations: {
    //     naturalSort: true,
    //     paths: ['database/migrations'],
    //   },
    //   schemaGeneration: {
    //     enabled: true,
    //     rulesPaths: ['./database/schema_rules.js'],
    //   },
    //   debug: app.inDev,
    // },

    /**
     * libSQL (Turso) connection.
     * Install package to switch: npm install @libsql/client
     */
    // libsql: {
    //   client: 'libsql',
    //   connection: {
    //     url: env.get('LIBSQL_URL'),
    //     authToken: env.get('LIBSQL_AUTH_TOKEN'),
    //   },
    //   useNullAsDefault: true,
    //   migrations: {
    //     naturalSort: true,
    //     paths: ['database/migrations'],
    //   },
    //   schemaGeneration: {
    //     enabled: true,
    //     rulesPaths: ['./database/schema_rules.js'],
    //   },
    //   debug: app.inDev,
    // },
  },
})

export default dbConfig
