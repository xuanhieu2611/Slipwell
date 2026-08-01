# Activity and undo

Owns append-only activity, mutation provenance, transactional outbox records,
and inverse mutations.

All beta-record mutations pass through `applyDomainMutation`. Its bounded
database RPC commits the record, a restricted mutation snapshot, an activity
event, and an `outbox_events` row as one transaction. Clients and workers must
not write domain tables directly. `undoDomainMutation` applies the recorded
inverse once; repeat calls return the original successful Undo result.

Activity metadata may contain only the operation, changed field names, and an
event schema version. Record bodies, titles, descriptions, and private facts
remain out of the general activity feed; the restricted mutation snapshot holds
only the information necessary to reverse a change.
