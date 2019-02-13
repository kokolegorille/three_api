defmodule ThreeApi.Repo do
  use Ecto.Repo,
    otp_app: :three_api,
    adapter: Ecto.Adapters.Postgres
end
