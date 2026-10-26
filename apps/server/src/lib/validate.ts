import * as v from "valibot";

export function firstIssue(issues: readonly v.BaseIssue<unknown>[]): string {
    return issues[0]?.message ?? "Data tidak valid";
}
