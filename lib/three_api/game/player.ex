defmodule ThreeApi.Game.Player do
  @derive {Jason.Encoder, only: [
    :id, :model, :colour, :action,
    :x, :y, :z, :h, :pb
  ]}

  defstruct [
    id:     nil,
    model:  nil,
    colour: nil,
    action: nil,
    x:      nil,
    y:      nil,
    z:      nil,
    h:      nil,
    pb:     nil,
    status: :loading
  ]
end
