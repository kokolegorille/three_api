defmodule ThreeApiWeb.GameChannel do
  use ThreeApiWeb, :channel
  require Logger
  @name __MODULE__
  alias ThreeApi.Game
  alias ThreeApi.Game.GameManager

  def join("game:" <> id, _params, socket) do
    Logger.debug(fn -> "Connected to game #{id}" end)
    uuid = UUID.uuid4()
    socket = assign(socket, :uuid, uuid)
    id
    |> String.to_integer()
    |> Game.get_worker()
    |> Game.join(uuid)

    GameManager.monitor_channel(self(), {id, uuid})

    {:ok, %{id: uuid}, socket}
  end

  def terminate(reason, _socket) do
    Logger.debug(fn -> "#{@name} > leave #{inspect(reason)}" end)
    :ok
  end
end
