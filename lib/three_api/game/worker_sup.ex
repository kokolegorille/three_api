defmodule ThreeApi.Game.WorkerSup do
  use DynamicSupervisor
  alias ThreeApi.Game.Worker

  def start_link(_args), do: DynamicSupervisor.start_link(__MODULE__, nil, name: __MODULE__)

  def start_worker(id, args \\ %{}) do
    spec = %{
      id: id,
      start: {Worker, :start_link, [id, args]},
      restart: :transient,
      type: :worker
    }
    DynamicSupervisor.start_child(__MODULE__, spec)
  end

  def init(_args) do
    opts = [strategy: :one_for_one]
    DynamicSupervisor.init(opts)
  end
end
