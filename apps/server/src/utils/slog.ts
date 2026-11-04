type LogLevel = "debug" | "info" | "warn" | "error";
export type LogData = {
    [key: string]: unknown;
};

const colors = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",

    // Log levels
    debug: "\x1b[36m", // Cyan
    info: "\x1b[32m", // Green
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red

    // Extras
    namespace: "\x1b[35m", // Magenta
    timestamp: "\x1b[90m", // Gray
};

export class Slog {
    private readonly namespace: string;

    private constructor(namespace: string) {
        this.namespace = namespace;
    }

    static New(namespace: string): Slog {
        return new Slog(namespace);
    }

    private formatTimestamp(): string {
        return new Date().toISOString();
    }

    private formatLevel(level: LogLevel): string {
        const color = colors[level];
        const label = level.toUpperCase().padEnd(5);
        return `${color}${label}${colors.reset}`;
    }

    private formatNamespace(): string {
        return `${colors.namespace}[${this.namespace}]${colors.reset}`;
    }

    private formatData(data?: LogData): string {
        if (!data || Object.keys(data).length === 0) {
            return "";
        }

        const formatted = Object.entries(data)
            .map(([key, value]) => {
                const stringValue =
                    typeof value === "object" ? JSON.stringify(value) : String(value);
                return `${colors.dim}${key}=${colors.reset}${stringValue}`;
            })
            .join(" ");

        return ` ${formatted}`;
    }

    private log(level: LogLevel, message: string, data?: LogData): void {
        const timestamp = `${colors.timestamp}${this.formatTimestamp()}${colors.reset}`;
        const formattedLevel = this.formatLevel(level);
        const namespace = this.formatNamespace();
        const formattedData = this.formatData(data);

        const output = `${timestamp} ${formattedLevel} ${namespace} ${message}${formattedData}`;

        switch (level) {
            case "error":
                console.error(output);
                break;
            case "warn":
                console.warn(output);
                break;
            default:
                console.log(output);
        }
    }

    debug(message: string, data?: LogData): void {
        this.log("debug", message, data);
    }

    info(message: string, data?: LogData): void {
        this.log("info", message, data);
    }

    warn(message: string, data?: LogData): void {
        this.log("warn", message, data);
    }

    error(message: string, data?: LogData): void {
        this.log("error", message, data);
    }
}
