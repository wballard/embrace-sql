[ ] Go to one result set
[ ] Patch console -- error, info, debug, log (== info), warn to write JSONified objects
[ ] Generate and test a JS client library per docs getting started
[ ] Docker container with CLI
  [ ] docker CLI to docs
  [ ] `init` -- seems simple enough -- generate in CWD, remember to generate a compose...
  [ ] `start` -- called by docker compose, but for purists that want to map their own ports and stuff...
  [ ] main and fork workers with PM2? Auto # CPU * 2 workers
  [ ] watcher -- sql and config changes should regenerate / restart / refork -- PM2?
[ ] ** At this point the getting started should be 'true'
[ ] database support
  [ ] Connect two SQLite
  [ ] `reload` -- how will we 'signal' to a running container? Should it just watch and 'try' -- connect is win then generate?
[ ] migrations
  [ ] `migrate` -- I don't think we need to signal a running container, I think we just need to 'do' it as a CLI
[ ] actually wire in the event handlers
  [ ] the 'after' handlers can and will modify the resultset types and generation
[ ] pLimit for query execution per worker per database -- only one -- no need for connection pooling
[ ] detect broken connections and kick workers
[ ] prometheus metrics in the execution pipelines
[ ] AutoCRUD
  [ ] inspect all the user tables
  [ ] SELECT, UPDATE, DELETE for every indexed possibility, no table scan!
  [ ] INSERT is full insert
  [ ] SQLite test database, find a schema somewhere
[ ] Connect MySQL
[ ] Connect PostGres
[ ] MySQL test database, Inspire
[ ] PostGres test database, Excalibur