defmodule ThreeApi.Game do
  alias ThreeApi.Game.{Player, Worker, WorkerSup}

  def get_worker(name) do
    case Worker.whereis_name(name) do
      nil ->
        case WorkerSup.start_worker(name) do
          {:ok, worker} -> worker
          {:error, _reason} -> nil
        end
      worker ->
        worker
    end
  end

  def join(game, uuid) do
    Worker.join(game, %Player{id: uuid})
  end

  def leave(game, uuid) do
    Worker.leave(game, %Player{id: uuid})
  end
end
