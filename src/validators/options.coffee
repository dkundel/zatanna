tv4 = require('tv4').tv4

module.exports = (options) ->
  tv4.validateMultiple options,
    "type": "object"
    additionalProperties: false
    properties:
      liveCompletion:
        type: 'boolean'
        required: false
        description: 'Triggers autocomplete while typing'