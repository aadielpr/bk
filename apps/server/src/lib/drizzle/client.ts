import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export type Database = PostgresJsDatabase;

export class DatabaseClient {
    private client!: postgres.Sql;
    private database!: Database;

    constructor(private readonly connectionString: string) {}

    init(): this {
        this.client = postgres(this.connectionString, { max: 10, prepare: false });
        return this;
    }

    connect(): this {
        this.database = drizzle({ client: this.client });
        return this;
    }

    get db(): Database {
        return this.database;
    }

    async close(): Promise<void> {
        await this.client.end();
    }
}
