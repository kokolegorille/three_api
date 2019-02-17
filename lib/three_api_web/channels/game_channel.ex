defmodule ThreeApiWeb.GameChannel do
  use ThreeApiWeb, :channel
  require Logger
  @name __MODULE__
  @refresh_time_in_ms 30
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

    Process.send_after(self(), {:tick, []}, @refresh_time_in_ms)

    {:ok, %{id: uuid}, socket}
  end

  def handle_in("init", payload, socket) do
    "game:" <> id = socket.topic
    worker = id
    |> String.to_integer()
    |> Game.get_worker()

    Game.update(worker, socket.assigns.uuid, payload)
    world = Game.get_world(worker)
    push(socket, "world_init", %{world: world})
    {:noreply, socket}
  end

  def handle_in("update", payload, socket) do
    "game:" <> id = socket.topic
    id
    |> String.to_integer()
    |> Game.get_worker()
    |> Game.update(socket.assigns.uuid, payload)

    {:noreply, socket}
  end

  def handle_in("player_ready", _payload, socket) do
    "game:" <> id = socket.topic
    uuid = socket.assigns.uuid

    worker = id
    |> String.to_integer()
    |> Game.get_worker()

    Game.ready(worker, uuid)
    player = Game.get_player(worker, uuid)
    broadcast_from!(socket, "game_joined", %{player: player})

    {:noreply, socket}
  end

  def handle_in(command, payload, socket) do
    message = "#{@name} > Unknown command '#{command}' " <>
      "(#{inspect(command, base: :hex)}) " <>
      "with payload #{inspect(payload)}"

    Logger.debug fn -> message end
    {:noreply, socket}
  end

  def handle_info({:tick, previous_state}, socket) do
    "game:" <> id = socket.topic

    worker = id
    |> String.to_integer()
    |> Game.get_worker()

    world = Game.get_world(worker)
    diff = get_diff(world, previous_state)

    if length(diff) > 0, do: broadcast!(socket, "world_update", %{world: diff})

    Process.send_after(self(), {:tick, world}, @refresh_time_in_ms)
    {:noreply, socket}
  end

  def terminate(reason, _socket) do
    Logger.debug(fn -> "#{@name} > leave #{inspect(reason)}" end)
    :ok
  end

  defp get_diff(world, previous) do
    previous_map = previous
    |> Enum.map(fn p -> {p.id, p} end)
    |> Enum.into(%{})

    # Filter player's event that were the same in the previous state
    # except for in place action!
    Enum.filter(world, fn player ->
      player.action in ["Idle", "Pointing", "Pointing Gesture", "Belly Dance"] ||
      player != Map.get(previous_map, player.id)
    end)
  end
end
