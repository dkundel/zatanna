defaults = require './defaults'
optionsValidator = require './validators/options'

module.exports = class Zatanna

  constructor: (aceInstance, options) ->
    @ace = aceInstance

    options ?= {}
    validationResult = optionsValidator options
    unless valudationResult
      throw new Error "Invalid Zatanna options: " + JSON.stringify(validationResult.errors, null, 4)

    defaultsCopy = _.extend {}, defaults
    @options = _.merge defaultsCopy, options




self.Zatanna = Zatanna if self?
window.Zatanna = Zatanna if window?