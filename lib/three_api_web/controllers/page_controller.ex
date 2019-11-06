defmodule ThreeApiWeb.PageController do
  use ThreeApiWeb, :controller

  # def index(conn, _params) do
  #   file = "priv/static/index.html"
  #   {:ok, binary} = File.read(file)
  #   html(conn, binary)
  # end

  def index(conn, _params) do
    priv = :code.priv_dir(:three_api)
    file = Path.join(priv, "static/index.html")
    {:ok, binary} = File.read(file)
    html(conn, binary)
  end
end
