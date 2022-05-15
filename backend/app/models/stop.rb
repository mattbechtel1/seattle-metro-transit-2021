class Stop < ApplicationRecord
  acts_as_copy_target
  belongs_to :stop, optional: true
  has_many :stoptimes
  has_many :trips, through: :stoptimes
  has_many :routes, through: :trips

  alias_attribute :StopName, :name
  alias_attribute :Predictions, :bus_predictions

  def bus_predictions
    self.stoptimes.buses_next_hour
  end

end
