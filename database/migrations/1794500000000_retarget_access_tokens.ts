import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Los tokens del starter apuntaban a `users`. La cuenta real es `usuario`.
 */
export default class extends BaseSchema {
  async up() {
    this.schema.raw('DELETE FROM auth_access_tokens')
    this.schema.raw(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'auth_access_tokens'
          AND att.attname = 'tokenable_id'
          AND con.contype = 'f';

        IF constraint_name IS NOT NULL THEN
          EXECUTE format('ALTER TABLE auth_access_tokens DROP CONSTRAINT %I', constraint_name);
        END IF;
      END $$;
    `)
    this.schema.raw('ALTER TABLE auth_access_tokens ALTER COLUMN tokenable_id TYPE BIGINT')
    this.schema.raw(`
      ALTER TABLE auth_access_tokens
      ADD CONSTRAINT auth_access_tokens_tokenable_id_foreign
      FOREIGN KEY (tokenable_id) REFERENCES usuario (id_usuario) ON DELETE CASCADE
    `)
  }

  async down() {
    this.schema.raw('DELETE FROM auth_access_tokens')
    this.schema.raw(
      'ALTER TABLE auth_access_tokens DROP CONSTRAINT IF EXISTS auth_access_tokens_tokenable_id_foreign'
    )
    this.schema.raw('ALTER TABLE auth_access_tokens ALTER COLUMN tokenable_id TYPE INTEGER')
    this.schema.raw(`
      ALTER TABLE auth_access_tokens
      ADD CONSTRAINT auth_access_tokens_tokenable_id_foreign
      FOREIGN KEY (tokenable_id) REFERENCES users (id) ON DELETE CASCADE
    `)
  }
}
