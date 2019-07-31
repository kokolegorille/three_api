defmodule ThreeApi.Game do
  alias ThreeApi.Game.{Player, Worker, WorkerSup}

  def get_worker(name) do
    # https://elixirforum.com/t/how-to-check-globally-named-agent/24056/2
    case WorkerSup.start_worker(name) do
      {:ok, worker} -> worker
      {:error, {:already_started, worker}} -> worker
      _response -> nil
    end
  end

  defdelegate get_world(game), to: Worker

  defdelegate get_player(game, uuid), to: Worker

  defdelegate get_world_diff(game, previous_state), to: Worker

  def join(game, uuid) do
    Worker.join(game, %Player{id: uuid})
  end

  def leave(game, uuid) do
    Worker.leave(game, %Player{id: uuid})
  end

  def ready(game, uuid) do
    Worker.ready(game, %Player{id: uuid})
  end

  def update(game, uuid, %{
    "model" => model, "colour" => colour,
    "action" => action,
    "h" => h, "pb" => pb, "x" => x, "y" => y, "z" => z
  }) do
    data = [
      model: model, colour: colour,
      action: action,
      h: h, pb: pb, x: x, y: y, z: z
    ]
    Worker.update(game, uuid, data)
  end

  def update(game, uuid, %{
    "action" => action,
    "h" => h, "pb" => pb, "x" => x, "y" => y, "z" => z
  }) do
    data = [
      action: action,
      h: h, pb: pb, x: x, y: y, z: z
    ]
    Worker.update(game, uuid, data)
  end

  def notify(message), do: ThreeApiWeb.Notifier.notify(message)
end
