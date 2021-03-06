defmodule ThreeApi.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  def start(_type, _args) do
    # List all child processes to be supervised
    children = [
      # Start the Ecto repository
      ThreeApi.Repo,
      # Start the endpoint when the application starts
      ThreeApiWeb.Endpoint,
      # Starts a worker by calling: ThreeApi.Worker.start_link(arg)
      # {ThreeApi.Worker, arg},

      {Registry, keys: :unique, name: Registry.GameWorkers},
      ThreeApi.Game.GameManager,
      ThreeApi.Game.WorkerSup,
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: ThreeApi.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  def config_change(changed, _new, removed) do
    ThreeApiWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
