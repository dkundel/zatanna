tv4 = require('tv4').tv4

module.exports = (options) ->
  tv4.validateMultiple options,
    "type": "object"
    additionalProperties: false
    properties:
      basic:
        type: 'boolean'
        required: false
        description: 'Basic autocompletion based on keywords used in code'
      snippets:
        type: 'boolean'
        required: false
        description: 'Offers code snippets for autocomplete'
      liveCompletion:
        type: 'boolean'
        required: false
        description: 'Triggers autocomplete while typing'
      language:
        type: 'string'
        required: false
        description: 'Language to load default snippets'
      completers:
        type: 'object'
        additionalProperties: false
        properties:
          snippets:
            type: 'boolean'
            required: false
            description: 'Show snippets suggestions in autocomplete popup'
          keywords:
            type: 'boolean'
            required: false
            description: 'Show keywords suggestions in autocomplete popup'
          text:
            type: 'boolean'
            required: false
            description: 'Show text content suggestions in autocomplete popup'