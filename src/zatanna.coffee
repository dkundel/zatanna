defaults = require './defaults'
optionsValidator = require './validators/options'

module.exports = class Zatanna

  constructor: (aceEditor, options) ->
    @editor = aceEditor
    config = ace.require 'ace/config'

    options ?= {}
    validationResult = optionsValidator options
    unless validationResult
      throw new Error "Invalid Zatanna options: " + JSON.stringify(validationResult.errors, null, 4)

    defaultsCopy = _.extend {}, defaults
    @options = _.merge defaultsCopy, options

    ace.config.loadModule 'ace/ext/language_tools', () =>
      @snippetManager = ace.require('ace/snippets').snippetManager
      @setAceOptions()
      @copyCompleters()
      @activateCompleter()

  setAceOptions: () ->
    aceOptions = 
      'enableLiveAutocompletion': @options.liveCompletion 
      'enableBasicAutocompletion': @options.basic
      'enableSnippets': @options.snippets

    @editor.setOptions aceOptions

  copyCompleters: () ->
    @completers = {}
    @completers.snippets =
      pos: 0
    @completers.text =
      pos: 1
    @completers.keywords =
      pos: 2

    [@completers.snippets.comp, @completers.text.comp, @completers.keywords.comp] = @editor.completers

    @completers.snippets.comp = require('./completers/snippets') @snippetManager # Replace the default snippet completer with our custom one
    @completers.text.comp = require('./completers/text') @editor # Replace default text completer with custom one

  activateCompleter: (comp) ->
    if Array.isArray comp
      @editor.completers = comp
    else if typeof comp is 'string'
      if @completers[comp]?
        @editor.completers.splice(@completers[comp].pos, 0, @completers[comp].comp)
    else 
      @editor.completers = []
      for type, comparator of @completers
        if @options.completers[type] is true
          @activateCompleter type 


  addSnippets: (snippets, language) ->
    @options.language = language
    ace.config.loadModule 'ace/ext/language_tools', () =>
      @snippetManager = ace.require('ace/snippets').snippetManager
      snippetModulePath = 'ace/snippets/' + language
      ace.config.loadModule snippetModulePath, (m) => 
        if m?        
          @snippetManager.files[language] = m 
          @snippetManager.unregister m.snippets if m.snippets?.length > 0
          @snippetManager.unregister @oldSnippets if @oldSnippets?
          m.snippets = @snippetManager.parseSnippetFile m.snippetText
          m.snippets.push s for s in snippets
          @snippetManager.register m.snippets
          @oldSnippets = m.snippets

  setLiveCompletion: (val) ->
    if val is true or val is false
      @options.liveCompletion = val
      @setAceOptions()

  set: (setting, value) ->
    switch setting
      when 'snippets' or 'completers.snippets'
        return unless typeof value is 'boolean'
        @options.snippets = value
        @options.completers.snippets = value
        @setAceOptions()
        @activateCompleter 'snippets'
      when 'basic'
        return unless typeof value is 'boolean'
        @options.basic = value
        @setAceOptions()
        @activateCompleter()
      when 'liveCompletion'
        return unless typeof value is 'boolean'
        @options.liveCompletion = value
        @setAceOptions()
        @activateCompleter()
      when 'language'
        return unless typeof value is 'string'
        @options.language = value
        @setAceOptions()
        @activateCompleter()
      when 'completers.keywords'
        return unless typeof value is 'boolean'
        @options.completers.keywords = value
        @activateCompleter()
      when 'completers.text'
        return unless typeof value is 'boolean'
        @options.completers.text = value
        @activateCompleter()
    return

self.Zatanna = Zatanna if self?
window.Zatanna = Zatanna if window?