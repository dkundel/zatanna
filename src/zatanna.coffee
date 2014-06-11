defaults = require './defaults'
optionsValidator = require './validators/options'

module.exports = class Zatanna

  constructor: (aceEditor, options) ->
    ace.require 'ace/ext/language_tools'
    @editor = aceEditor
    @snippetManager = ace.require('ace/snippets').snippetManager

    options ?= {}
    validationResult = optionsValidator options
    unless valudationResult
      throw new Error "Invalid Zatanna options: " + JSON.stringify(validationResult.errors, null, 4)

    defaultsCopy = _.extend {}, defaults
    @options = _.merge defaultsCopy, options

    @setAceOptions()

  setAceOptions: () ->
    @editor.setOptions {
      enableLiveAutocompletion: @options.liveCompletion 
      enableBasicAutocompletion: @options.basic
      enableSnippets: @options.snippets
    }

  addSnippets: (snippets) ->
    snippetModulePath = 'ace/snippets/' + @options.language
    config = ace.require 'ace/config'
    ace.config.loadModule snippetModulePath, (m) => 
      if m?        
        @snippetManager.files[@options.language] = m 
        m.snippets = @snippetManager.parseSnippetFile m.snippetText
        m.snippets.push s for s in snippets
        @snippetManager.register m.snippets, m.scope

  setLiveCompletion: (val) ->
    if val is true or val is false
      @options.liveCompletion = val
      @setAceOptions()

self.Zatanna = Zatanna if self?
window.Zatanna = Zatanna if window?