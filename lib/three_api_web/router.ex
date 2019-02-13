defmodule ThreeApiWeb.Router do
  use ThreeApiWeb, :router

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", ThreeApiWeb do
    pipe_through :api
  end

  scope "/", ThreeApiWeb do
    get "/*path", StaticController, :index
  end
end
