defmodule ThreeApi.Game.GameManager do
  use GenServer
  require Logger

  @name __MODULE__
  alias ThreeApi.Game

  def start_link(_args), do: GenServer.start_link(__MODULE__, %{}, name: @name)

  def monitor_channel(pid, channel_info), do: GenServer.cast(@name, {:monitor, pid, channel_info})

  @impl GenServer
  def init(args) do
    Process.flag(:trap_exit, true)
    {:ok, args}
  end

  @impl GenServer
  def handle_cast({:monitor, pid, channel_info}, state) do
    Logger.debug fn -> "Receive channel info : #{inspect channel_info}" end
    Process.monitor(pid)
    state = Map.put(state, pid, channel_info)
    {:noreply, state}
  end

  @impl GenServer
  def handle_info({:DOWN, _ref, :process, pid, status}, state) do
    channel_info = Map.get(state, pid)
    Logger.debug fn -> "DOWN catched! #{inspect channel_info} #{inspect status}" end

    # Cleanup when channel dies
    if channel_info do
      {id, uuid} = channel_info
      id
      |> String.to_integer()
      |> Game.get_worker()
      |> Game.leave(uuid)
    end

    state = Map.delete(state, pid)
    {:noreply, state}
  end

  @impl GenServer
  def terminate(reason, _state) do
    Logger.debug fn -> "#{__MODULE__} stopped : #{inspect(reason)}" end
    :ok
  end
end
