defmodule ThreeApiWeb.Notifier do
  require Logger

  def notify(%{payload: %{id: id, uuid: uuid}, type: :game_left}) do
    ThreeApiWeb.Endpoint.broadcast!("game:#{id}", "game_left", %{uuid: uuid})
  end

  def notify(message) do
    Logger.debug(fn -> "Unknown notification #{inspect(message)}" end)
  end
end
