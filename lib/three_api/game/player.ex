defmodule ThreeApi.Game.Player do
  defstruct [
    id:     nil,
    model:  nil,
    action: nil,
    x:      nil,
    y:      nil,
    z:      nil,
    h:      nil,
    pb:     nil,
    status: :loading
  ]
end
