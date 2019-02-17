defmodule ThreeApi.Game.Worker do
  use GenServer
  require Logger

  alias Registry.GameWorkers, as: RegWorkers
  alias ThreeApi.Game.Player

  def start_link(name, args \\ %{}) do
    GenServer.start_link(__MODULE__, args, name: via_tuple(name))
  end

  def stop(game), do: GenServer.cast(game, :stop)

  def get_state(game), do: GenServer.call(game, :get_state)

  def get_world(game), do: GenServer.call(game, :get_world)

  def get_player(game, uuid), do: GenServer.call(game, {:get_player, uuid})

  def get_world_diff(game, previous_state), do: GenServer.call(game, {:get_world_diff, previous_state})

  def join(game, %Player{} = player), do: GenServer.call(game, {:join, player})

  def leave(game, %Player{} = player), do: GenServer.call(game, {:leave, player})

  def ready(game, %Player{} = player), do: GenServer.call(game, {:ready, player})

  def update(game, uuid, data), do: GenServer.cast(game, {:update, uuid, data})

  def whereis_name(name) do
    case Registry.lookup(RegWorkers, name) do
      [{pid, _ref}] -> pid
      [] -> nil
    end
  end

  @impl GenServer
  def init(args) do
    Logger.debug fn -> "#{__MODULE__} is starting with args #{inspect args}" end
    {:ok, args}
  end

  @impl GenServer
  def handle_call(:get_state, _from, state), do: {:reply, state, state}

  @impl GenServer
  def handle_call(:get_world, _from, state) do
    reply = get_world_tally(state)
    {:reply, reply, state}
  end

  @impl GenServer
  def handle_call({:get_player, uuid}, _from, state) do
    reply = Map.get(state, uuid)
    {:reply, reply, state}
  end

  @impl GenServer
  def handle_call({:join, %Player{id: id} = player}, _from, state) do
    state = Map.put(state, id, player)
    {:reply, state, state}
  end

  @impl GenServer
  def handle_call({:leave, %Player{id: id}}, _from, state) do
    state = Map.delete(state, id)
    if state == %{} do
      # IMPORTANT!
      {:stop, :normal, state, state}
    else
      {:reply, state, state}
    end
  end

  @impl GenServer
  def handle_call({:ready, %Player{id: id} = player}, _from, state) do
    state = Map.update(state, id, %{player | status: :active}, & %{&1 | status: :active})
    {:reply, state, state}
  end

  @impl GenServer
  def handle_cast({:update, id, data}, state) do
    state = Map.update!(state, id, & struct(&1, data))
    {:noreply, state}
  end

  @impl GenServer
  def handle_cast(:stop, state), do: {:stop, :normal, state}

  @impl GenServer
  def terminate(reason, _state) do
    Logger.debug fn -> "#{__MODULE__} stopped : #{inspect(reason)}" end
    :ok
  end

  # Private

  defp via_tuple(name), do: {:via, Registry, {RegWorkers, name}}

  defp get_world_tally(state) do
    state
    |> Enum.filter(fn {_k, v} -> v.status == :active end)
    |> Enum.map(fn {_k, v} -> v end)
  end
end
