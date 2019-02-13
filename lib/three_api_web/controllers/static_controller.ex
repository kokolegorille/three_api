defmodule ThreeApiWeb.StaticController do
  use ThreeApiWeb, :controller

  def index(conn, _params) do
    file = "priv/static/index.html"
    {:ok, binary} = File.read(file)
    html(conn, binary)
  end
end
