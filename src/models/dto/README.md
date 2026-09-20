# Pending API contracts

`domain.ts` contains client/demo models, not database entities or confirmed wire DTOs. No REST DTO is currently claimed. When OpenAPI is supplied, add explicit DTO types and mappers here; do not send the complete Snapshot or Command as a backend payload. Confirm enum casing, IDs, pagination, scope filters, errors, version tokens, file URLs and dates. Passwords/embeddings/storage credentials never enter view models.
