tv4 = require('tv4/tv4').tv4

module.exports = (options) ->
  tv4.validateMultiple options,
    "type": "object"
    additionalProperties: false
    properties:
      autoLineEndings:
        type: 'object'
        required: false
        description: "Mapping ace mode language to line endings to automatically insert.  E.g. javacscript: ';'"
      basic:
        type: 'boolean'
        required: false
        description: 'Basic autocompletion based on keywords used in code'
      snippets: # TODO: remove this sometime after 10/23/14
        type: 'boolean'
        required: false
        description: 'Offers code snippets for autocomplete'
      snippetsLangDefaults:
        type: 'boolean'
        required: false
        description: 'If true, use language default snippets'
      liveCompletion:
        type: 'boolean'
        required: false
        description: 'Triggers autocomplete while typing'
      language:
        type: 'string'
        required: false
        description: 'Language to load default snippets'
      languagePrefixes:
        type: 'string'
        required: false
        description: 'Language prefixes that should be removed for snippets'
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
      popupFontSizePx:
        type: 'number'
        required: false
        description: 'Font-size in pixels for popup text'
      popupWidthPx:
        type: 'number'
        required: false
        description: 'Width in pixels for popup'