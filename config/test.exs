use Mix.Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :three_api, ThreeApiWeb.Endpoint,
  http: [port: 4002],
  server: false

# Print only warnings and errors during test
config :logger, level: :warn

# Configure your database
config :three_api, ThreeApi.Repo,
  username: "postgres",
  password: "postgres",
  database: "three_api_test",
  hostname: "localhost",
  pool: Ecto.Adapters.SQL.Sandbox
